import os
from dotenv import load_dotenv
import chromadb
from langchain_community.embeddings import HuggingFaceEmbeddings

load_dotenv()

CHROMA_DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "chroma_db"))
COLLECTION_NAME = os.getenv("CHROMA_DB_COLLECTION_NAME", "compliance_shield_v1")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL_VERSION", "all-MiniLM-L6-v2")

class ComplianceRetriever:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        self.embeddings_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        
        try:
            self.collection = self.client.get_collection(name=COLLECTION_NAME)
        except Exception as e:
            print(f"Warning: Collection not found or error loading: {e}")
            self.collection = None
            
    def _format_results(self, results):
        formatted = []
        if not results or not results['documents']:
            return formatted
            
        for i in range(len(results['documents'][0])):
            doc = results['documents'][0][i]
            meta = results['metadatas'][0][i]
            formatted.append({
                "Text": doc,
                "Metadata": meta
            })
        return formatted

    def get_sovereign_law(self, concept, n_results=3):
        """Search only Layer 2 (Sovereign)."""
        if not self.collection:
            return []
            
        embedded_query = self.embeddings_model.embed_query(concept)
        results = self.collection.query(
            query_embeddings=[embedded_query],
            n_results=n_results,
            where={"layer": "Sovereign"}
        )
        return self._format_results(results)

    def check_for_drift(self, legacy_section):
        """Query Layer 1, find the supersedes tag, and pull the corresponding Layer 2 text."""
        if not self.collection:
            return {"drift_detected": False, "legacy": None, "sovereign": None}
            
        # First find the legacy section
        legacy_results = self.collection.query(
            query_texts=[legacy_section],
            n_results=1,
            where={"layer": "Legacy"}
        )
        
        if not legacy_results or not legacy_results['documents'] or not legacy_results['documents'][0]:
            return {"drift_detected": False, "legacy": None, "sovereign": None}
            
        legacy_meta = legacy_results['metadatas'][0][0]
        legacy_text = legacy_results['documents'][0][0]
        
        supersedes = legacy_meta.get('supersedes', 'None')
        
        # In a real scenario, we might use a predefined map. For now, if "supersedes" is None, 
        # we might do a semantic search in Sovereign layer to find equivalent concepts
        # as a fallback, because actual mappings might not be present in the raw PDF text.
        
        # Fallback semantic search to Sovereign layer based on legacy text concept
        equivalent_results = self.get_sovereign_law(legacy_text[:500], n_results=1)
        
        sovereign_match = None
        if equivalent_results:
            sovereign_match = equivalent_results[0]
            
        return {
            "drift_detected": True,
            "legacy": {
                "Text": legacy_text,
                "Metadata": legacy_meta
            },
            "sovereign_equivalent": sovereign_match
        }

    def hybrid_lookup(self, section_no, act_name, n_results=3):
        """Combine keyword matching (metadata) with semantic search."""
        if not self.collection:
            return []
            
        results = self.collection.query(
            query_texts=[f"Section {section_no} of {act_name}"],
            n_results=n_results,
            where={
                "$and": [
                    {"section_id": section_no},
                    {"act_name": {"$contains": act_name}} # Note: chromadb might not support $contains directly, we'll try basic matches
                ]
            }
        )
        
        # If metadata filtering strictly fails due to format mismatches, fallback to pure semantic
        if not results or not results['documents'] or not results['documents'][0]:
            results = self.collection.query(
                query_texts=[f"Section {section_no} of {act_name}"],
                n_results=n_results
            )
            
        return self._format_results(results)

if __name__ == "__main__":
    # Test the standalone engine
    engine = ComplianceRetriever()
    print("Testing Sovereign Law search...")
    res = engine.get_sovereign_law("data breach notification")
    for r in res:
        print(f"[{r['Metadata']['act_name']} Sec {r['Metadata']['section_id']}] {r['Text'][:100]}...")
