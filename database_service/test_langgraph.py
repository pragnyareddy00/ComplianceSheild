import sys
import os

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from langgraph_engine import compliance_graph
from pprint import pprint

def test_engine():
    doc = '''
--- [PAGE 1] ---
This agreement outlines the data handling practices of the Company. 
As per IT Act Section 43A, the body corporate must implement reasonable security practices. 
Any disputes will be resolved in accordance with The Information Technology Act, 2000.
    '''
    
    initial_state = {
        "raw_document": doc,
        "raw_document_segments": [{"page": 1, "text": doc}],
        "analysis_report": [],
        "audit_results": [],
        "detected_drift": [],
        "compliance_score": 0,
        "final_report": {},
        "next_agent": ""
    }
    
    print("--- Starting LangGraph Compliance Audit ---")
    
    try:
        final_state = compliance_graph.invoke(initial_state)
        print("\n--- Final UI-Mapped JSON ---")
        pprint(final_state.get("final_report", {}))
    except Exception as e:
        print(f"Error during execution: {e}")

if __name__ == "__main__":
    test_engine()
