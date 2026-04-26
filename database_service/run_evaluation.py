import os
import time
import csv
import json
from collections import defaultdict
from pathlib import Path
from dotenv import load_dotenv

import chromadb
from langsmith import Client
from langsmith.evaluation import evaluate
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_community.document_loaders import PyPDFLoader

# Import actual pipeline
from langgraph_engine import compliance_graph

load_dotenv()

# We strictly need OPENAI API key for evaluating
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY is missing. Evaluation cannot proceed.")

client = Client()
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Directory configurations
DB_SVC_DIR = Path(__file__).parent.resolve()
LEGACY_DOCS_DIR = DB_SVC_DIR.parent / "database" / "Layer_1_Legacy"
GROUND_TRUTH_CSV = DB_SVC_DIR / "ground_truth.csv"

# ==========================================================
# 1. Pipeline Target: The Function we are Evaluating
# ==========================================================
def document_pipeline(inputs: dict) -> dict:
    """
    Executes the actual LangGraph pipeline on the document.
    """
    doc_path = inputs["document_path"]
    
    loader = PyPDFLoader(doc_path)
    pages = loader.load()
    doc_text = "\n".join([p.page_content for p in pages[:3]])
    
    # Run through the actual graph
    try:
        initial_state = {"raw_document": doc_text, "audit_results": [], "detected_drift": []}
        result_state = compliance_graph.invoke(initial_state)
        final_report = result_state.get("final_report", {})
        drift_table = final_report.get("drift_table", [])
        
        # We need to extract what the graph found to compare with ground truth
        audit_results = result_state.get("audit_results", [])
        privacy_findings = []
        for res in audit_results:
            if res.get("agent") == "Privacy":
                privacy_findings = res.get("findings", [])
                break
                
        # Get raw text for hallucination check
        audit_text = json.dumps(final_report.get("compliance_feed", []))
        
        # We will collect the sovereign fixes as retrieved context proxy based on the new RAG-like drift approach
        retrieved_context = json.dumps(drift_table)

        extracted_clauses_count = len(privacy_findings)
        
    except Exception as e:
        print(f"Pipeline error for {doc_path}: {e}")
        audit_text = str(e)
        extracted_clauses_count = 0
        retrieved_context = ""
        final_report = {}
        drift_table = []
        doc_text = ""
        privacy_findings = []
        
    return {
        "extracted_clauses_count": extracted_clauses_count,
        "extracted_clauses_raw": privacy_findings,
        "audit_report": audit_text,
        "retrieved_context": retrieved_context,
        "drift_table": drift_table,
        "raw_text": doc_text[:5000]
    }

# ==========================================================
# 2. Custom Evaluators
# ==========================================================
def extraction_recall_evaluator(run, example) -> dict:
    """
    Calculates Extraction Recall: % of total ground truth clauses found (Extraction Recall).
    """
    outputs = run.outputs
    extracted_count = outputs.get("extracted_clauses_count", 0)
    
    expected_count = example.outputs.get("expected_clauses_count", 1) 
    
    score = min(extracted_count / max(expected_count, 1), 1.0)
    return {"key": "Extraction Recall", "score": score}

def context_precision_evaluator(run, example) -> dict:
    """
    Calculates Context Precision: Checks if expected statutes are present in the retrieved drift table context.
    """
    outputs = run.outputs
    drift_table = outputs.get("drift_table", [])
    expected_statutes = example.outputs.get("expected_statute_refs", [])
    
    if not expected_statutes:
        return {"key": "Context Precision", "score": 1.0}
        
    retrieved_statutes = [d.get("sovereign", "").lower() for d in drift_table]
    
    found_count = 0
    for exp_statute in expected_statutes:
        exp_lower = exp_statute.lower()
        # Loose match for sections/acts
        if any(exp_lower in ret.lower() or ret.lower() in exp_lower for ret in retrieved_statutes):
            found_count += 1
            
    score = found_count / len(expected_statutes) if expected_statutes else 0.0
    return {"key": "Context Precision", "score": score}

def hallucination_score_evaluator(run, example) -> dict:
    """
    Calculates Hallucination Score (Faithfulness): 
    Is the report factually consistent with raw_text and retrieved_context?
    """
    outputs = run.outputs
    audit = outputs.get("audit_report", "")
    source_text = outputs.get("raw_text", "")
    
    eval_prompt = f"""Evaluate Faithfulness (Hallucination Score):
    Source Document: {source_text[:3000]}
    Final Audit Report: {audit}
    
    Did the Final Audit Report hallucinate claims, variables, or findings that are NOT present in the Source? 
    Reply strictly with a float from 0.0 (total hallucination, many made up claims) to 1.0 (perfectly faithful, no hallucination)."""
    
    try:
        res = llm.invoke(eval_prompt)
        score = float(res.content.strip())
    except:
        score = 0.5
    return {"key": "Hallucination Score", "score": score}

def answer_relevancy_evaluator(run, example) -> dict:
    """
    Calculates Answer Relevancy: How well the final report answers the user's compliance query.
    """
    outputs = run.outputs
    audit = outputs.get("audit_report", "")
    query = example.outputs.get("user_query", "Evaluate this document for compliance.")
    
    eval_prompt = f"""Evaluate Answer Relevancy:
    User Query: {query}
    System Final Report: {audit}
    
    How well does the system report directly address the user's compliance query without waffling? 
    Reply strictly with a float from 0.0 (completely irrelevant) to 1.0 (highly relevant and direct)."""
    
    try:
        res = llm.invoke(eval_prompt)
        score = float(res.content.strip())
    except:
        score = 0.5
    return {"key": "Answer Relevancy", "score": score}

# ==========================================================
# 3. Provisioning Dataset & Running the Suite
# ==========================================================
def run_evaluation_suite():
    dataset_name = "Compliance_Eval_Graph_" + str(int(time.time()))
    
    if not GROUND_TRUTH_CSV.exists():
        print(f"Error: {GROUND_TRUTH_CSV} not found. Run build_ground_truth.py first.")
        return
        
    # Parse ground truth
    ground_truth_data = defaultdict(lambda: {"expected_clauses_count": 0, "expected_statute_refs": set()})
    with open(GROUND_TRUTH_CSV, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            doc_id = row["doc_id"]
            ground_truth_data[doc_id]["expected_clauses_count"] += 1
            if row["statute_ref"]:
                ground_truth_data[doc_id]["expected_statute_refs"].add(row["statute_ref"])
    
    # Gather PDFs
    pdfs = list(LEGACY_DOCS_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"Error: No PDFs found in {LEGACY_DOCS_DIR}")
        return
        
    # Only evaluate PDFs that exist in ground truth to be fair
    eval_pdfs = [p for p in pdfs if p.name in ground_truth_data]
    if not eval_pdfs:
        print("Error: None of the PDFs match the ground truth CSV 'doc_id's.")
        return
        
    # Limit to a small batch for speed (like 3)
    eval_pdfs = eval_pdfs[:3]
    
    print(f"Provisioning LangSmith Dataset '{dataset_name}' with {len(eval_pdfs)} documents...")
    dataset = client.create_dataset(dataset_name=dataset_name, description="Actual Graph Eval Dataset")
    
    # Create inputs/outputs for the dataset
    for pdf in eval_pdfs:
        doc_data = ground_truth_data[pdf.name]
        
        client.create_example(
            inputs={
                "document_path": str(pdf),
                "document_name": pdf.name
            },
            outputs={
                "expected_clauses_count": doc_data["expected_clauses_count"],
                "expected_statute_refs": list(doc_data["expected_statute_refs"]),
                "user_query": "Audit this document against compliance laws and extract key variables."
            },
            dataset_id=dataset.id,
        )
        
    print(f"Dataset created! Commencing automated LLM evaluation pipeline (Executing pipeline for all {len(eval_pdfs)} docs)...")
    print("Please wait, as generating evaluating metrics with OpenAI will take approximately 1-3 minutes...")
    
    # Kick off LangSmith Evaluation
    results = evaluate(
        document_pipeline,
        data=dataset_name,
        evaluators=[
            extraction_recall_evaluator,
            context_precision_evaluator,
            hallucination_score_evaluator,
            answer_relevancy_evaluator
        ],
        experiment_prefix="Compliance_Graph_Eval_",
        max_concurrency=2 # Keep low due to rate limits + heavy graph execution
    )
    
    print("\n========================================================")
    print("🏆 GRAPH EVALUATION PIPELINE COMPLETED")
    print("========================================================\n")
    print(f"You can view the full visual traces deeply in your LangSmith UI under project: {os.getenv('LANGCHAIN_PROJECT', 'default')}")
    print("\n(Note: Evaluation scores are asynchronously calculated in the background and pushed to your active LangSmith dashboard.)")
    print("========================================================")

if __name__ == "__main__":
    run_evaluation_suite()
