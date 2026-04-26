import os
import csv
import json
import chromadb
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# We will re-use ChromaDB setup paths dynamically based on your existing structure
CHROMA_DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "chroma_db"))
COLLECTION_NAME = os.getenv("CHROMA_DB_COLLECTION_NAME", "compliance_shield_v1")

class GroundTruthBuilder:
    def __init__(self, docs_dir: str, output_csv: str):
        self.docs_dir = Path(docs_dir)
        self.output_csv = Path(output_csv)
        
        # Initialize Vector DB connection to fetch statutory limitations
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        try:
            self.collection = self.chroma_client.get_collection(name=COLLECTION_NAME)
            print(f"Connected to ChromaDB Collection: {COLLECTION_NAME}")
        except Exception as e:
            print(f"Error connecting to ChromaDB Collection: {e}")
            self.collection = None

    def run_analyst_agent(self, document_path: str) -> list:
        """
        Uses ChatOpenAI to extract deterministic quantitative limitations from the legal PDF.
        """
        print(f"Running LLM extraction on {document_path}...")
        try:
            from langchain_community.document_loaders import PyPDFLoader
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import SystemMessage, HumanMessage
            import json
            
            # Load only the first few pages for quick extraction to save tokens during testing
            loader = PyPDFLoader(document_path)
            pages = loader.load()
            text_context = "\n".join([p.page_content for p in pages[:3]])
            
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
            system_prompt = """You are a precise Legal Data Extractor.
Analyze the provided legal document text and extract any quantitative compliance variables (e.g., payment days, data retention period, liability amounts, penalty limits).
Return strictly formatted JSON as a list of dictionaries with the exact structure:
[
  {
    "clause_text": "The company must retain data for 45 days...",
    "statute_ref": "DPDP Section 8",
    "extracted_value": 45,
    "variable_type": "Data Retention Days"
  }
]
If there are no quantitative variables, return an empty array [].
Do NOT wrap the output in markdown code blocks, return raw JSON."""

            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=text_context[:5000]) # chunk size safety
            ])
            
            response_text = response.content.strip().replace("```json", "").replace("```", "")
            try:
                extracted_data = json.loads(response_text)
                if isinstance(extracted_data, list):
                    return extracted_data
                return []
            except json.JSONDecodeError as e:
                print(f"JSON Parsing Error for {document_path}: {e}")
                return []
        except Exception as e:
            print(f"Error extracting from {document_path}: {e}")
            return []

    def get_statutory_limit(self, statute_ref: str, variable_type: str) -> float:
        """
        Retrieves the deterministic numerical limit from ChromaDB.
        """
        if not self.collection:
            return 0.0

        # Query the DB for the specific statute and ideally match variable_type in metadata
        results = self.collection.query(
            query_texts=[statute_ref],
            n_results=1
        )
        
        if results and results['metadatas'] and results['metadatas'][0]:
            metadata = results['metadatas'][0][0]
            # Assuming 'statutory_limit' is stored in metadata. 
            # Adjust the key based on your actual ChromaDB schema.
            # Example fallback to a dummy value if key is not found
            limit = metadata.get('statutory_limit')
            if limit is not None:
                return float(limit)
                
        print(f"Warning: No statutory limit found in Chroma for {statute_ref}. Defaulting to 0.")
        return 0.0 # Default/Fallback limit

    def evaluate_compliance(self, extracted_value: float, statutory_limit: float) -> tuple:
        """
        Deterministic Rule-Based comparison between the extracted value and statutory limit.
        Strict mathematical evaluation without AI approximations.
        """
        is_compliant = extracted_value <= statutory_limit
        expected_verdict = "Compliant" if is_compliant else "Non-Compliant"
        
        # Construct the math check reasoning text
        operator = "<=" if is_compliant else ">"
        math_check_result = f"Extracted ({extracted_value}) {operator} Statute ({statutory_limit})"
        
        return expected_verdict, math_check_result

    def build_ground_truth(self):
        """
        The main pipeline: Processes all PDFs, maps extraction to statutory checks,
        and generates the final deterministic Ground Truth CSV.
        """
        if not self.docs_dir.exists():
            print(f"Directory not found: {self.docs_dir}")
            return
            
        csv_headers = ["doc_id", "clause_text", "statute_ref", "extracted_value", "statutory_limit", "expected_verdict", "math_check_result"]
        
        # Open CSV to write records incrementally
        with open(self.output_csv, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=csv_headers)
            writer.writeheader()

            for count, pdf_file in enumerate(self.docs_dir.glob("*.pdf")):
                if count >= 3: # Limit to 3 files to save OpenAI tokens during test run
                    break
                doc_id = pdf_file.name
                
                # Step 1: Extract structured data using Analyst Agent
                extracted_variables = self.run_analyst_agent(str(pdf_file))
                
                for var in extracted_variables:
                    clause_text = var.get("clause_text", "")
                    statute_ref = var.get("statute_ref", "")
                    extracted_value = float(var.get("extracted_value", 0))
                    variable_type = var.get("variable_type", "")
                    
                    # Step 2: Deterministic Retrieval
                    statutory_limit = self.get_statutory_limit(statute_ref, variable_type)
                    
                    # Step 3: Math Evaluation
                    expected_verdict, math_check_result = self.evaluate_compliance(extracted_value, statutory_limit)
                    
                    # Step 4: Write to output
                    writer.writerow({
                        "doc_id": doc_id,
                        "clause_text": clause_text,
                        "statute_ref": statute_ref,
                        "extracted_value": extracted_value,
                        "statutory_limit": statutory_limit,
                        "expected_verdict": expected_verdict,
                        "math_check_result": math_check_result
                    })
                    
        print(f"Ground truth dataset generated successfully at: {self.output_csv}")

if __name__ == "__main__":
    # Adjust path down to where your test docs are located relative to database_service
    TEST_DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "Layer_1_Legacy"))
    OUTPUT_CSV = os.path.abspath(os.path.join(os.path.dirname(__file__), "ground_truth.csv"))
    
    builder = GroundTruthBuilder(docs_dir=TEST_DOCS_DIR, output_csv=OUTPUT_CSV)
    builder.build_ground_truth()
