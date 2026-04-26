import os
import re
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
import chromadb
from chromadb.config import Settings

load_dotenv()

CHROMA_DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "chroma_db"))
PDF_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
COLLECTION_NAME = os.getenv("CHROMA_DB_COLLECTION_NAME", "compliance_shield_v1")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL_VERSION", "all-MiniLM-L6-v2")

def get_files_to_process():
    files = []
    for layer in ["Layer_1_Legacy", "Layer_2_Sovereign"]:
        layer_path = os.path.join(PDF_BASE_DIR, layer)
        if os.path.exists(layer_path):
            for file in os.listdir(layer_path):
                if file.endswith(".pdf"):
                    files.append({
                        "path": os.path.join(layer_path, file),
                        "layer": layer.replace("Layer_1_", "").replace("Layer_2_", ""), # "Legacy" or "Sovereign"
                        "filename": file
                    })
    return files

def extract_section_id(text):
    # Match "Section \d+" or "Article \d+"
    match = re.search(r'(?:Section|Article)\s+(\d+[A-Z]?)', text, re.IGNORECASE)
    if match:
        return match.group(1)
    return "Unknown"

def infer_domain(filename):
    lower_name = filename.lower()
    if 'tax' in lower_name: return 'Tax'
    if 'labour' in lower_name or 'industrial' in lower_name: return 'Labor'
    if 'company' in lower_name: return 'Corporate'
    if 'penal' in lower_name or 'criminal' in lower_name or 'suraksha' in lower_name or 'nyaya' in lower_name: return 'Criminal'
    if 'evidence' in lower_name or 'sakshya' in lower_name: return 'Evidence'
    if 'privacy' in lower_name or 'data protection' in lower_name or 'dpdp' in lower_name: return 'Privacy'
    if 'intellectual' in lower_name or 'patent' in lower_name or 'copyright' in lower_name or 'trade mark' in lower_name: return 'Intellectual Property'
    if 'family' in lower_name or 'marriage' in lower_name or 'domestic violence' in lower_name: return 'Family Law'
    if 'land' in lower_name: return 'Property'
    if 'consumer' in lower_name: return 'Consumer'
    if 'motor' in lower_name: return 'Motor Vehicles'
    if 'contract' in lower_name: return 'Contract'
    if 'information technology' in lower_name or 'cyber' in lower_name: return 'Cyber'
    return 'General'

def process_pdfs():
    print(f"Initializing ChromaDB Client at {CHROMA_DB_DIR}")
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    
    # Use HuggingFace sentence transformers
    embeddings_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    
    text_splitter = RecursiveCharacterTextSplitter(
        separators=["\nSection ", "\nArticle ", "\n\n", "\n", " "],
        chunk_size=2000,
        chunk_overlap=200,
        keep_separator=True
    )

    pdf_files = get_files_to_process()
    print(f"Found {len(pdf_files)} PDFs to process.")

    total_chunks = 0
    layer_counts = {"Legacy": 0, "Sovereign": 0}

    for file_info in pdf_files:
        print(f"Processing: {file_info['filename']} ({file_info['layer']})")
        loader = PyPDFLoader(file_info["path"])
        docs = loader.load()
        
        chunks = text_splitter.split_documents(docs)
        
        act_name = file_info["filename"].replace(".pdf", "")
        domain = infer_domain(file_info["filename"])
        
        chunk_texts = []
        chunk_metadatas = []
        chunk_ids = []
        
        for i, chunk in enumerate(chunks):
            content = chunk.page_content
            # To extract section_id efficiently for the chunk:
            # We look at the first 100 characters, or just search the chunk.
            section_id = extract_section_id(content[:200]) # Look near the top for chunk-specific Section ID
            
            supersedes = "None"
            # Note: For real mappings, a dictionary would map 'BNS Section X' to 'IPC Section Y'.
            
            metadata = {
                "layer": file_info["layer"],
                "act_name": act_name,
                "section_id": section_id,
                "supersedes": supersedes,
                "domain": domain,
                "source": file_info["path"],
                "page": chunk.metadata.get("page", 0)
            }
            
            chunk_texts.append(content)
            chunk_metadatas.append(metadata)
            chunk_ids.append(f"{act_name}_chunk_{i}")
            
            layer_counts[file_info["layer"]] += 1
            total_chunks += 1
            
        # Batch ingest (Chroma recommended batch size is < 40000, we have ~few thousands per PDF usually)
        if chunk_texts:
            print(f"  Inserting {len(chunk_texts)} chunks for {act_name}...")
            # We use embeddings generated by HuggingFace 
            embedded_docs = embeddings_model.embed_documents(chunk_texts)
            
            # Sub-batch ingest if needed (Chroma usually supports thousands, but let's be safe)
            BATCH_SIZE = 500
            for i in range(0, len(chunk_texts), BATCH_SIZE):
                collection.upsert(
                    ids=chunk_ids[i:i+BATCH_SIZE],
                    documents=chunk_texts[i:i+BATCH_SIZE],
                    embeddings=embedded_docs[i:i+BATCH_SIZE],
                    metadatas=chunk_metadatas[i:i+BATCH_SIZE]
                )

    print(f"Ingestion complete! Total chunks: {total_chunks}")
    print(f"Sovereign chunks: {layer_counts['Sovereign']}")
    print(f"Legacy chunks: {layer_counts['Legacy']}")
    
if __name__ == "__main__":
    process_pdfs()
