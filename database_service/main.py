import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from io import BytesIO

try:
    import pypdf
except ImportError:
    pypdf = None

from langgraph_engine import compliance_graph

app = FastAPI(title="Compliance Shield API")

# Enable CORS to allow the React frontend to fetch from this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...), prompt: str = Form(None)):
    """Receives file upload, parses its text, and sends it to LangGraph."""
    if not file.filename.endswith((".txt", ".md", ".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Unsupported file format.")
        
    content = await file.read()
    raw_text = ""
    raw_document_segments = []
    
    if file.filename.endswith(".pdf"):
        if pypdf is None:
            raise HTTPException(status_code=500, detail="pypdf not installed.")
        try:
            pdf_reader = pypdf.PdfReader(BytesIO(content))
            line_counter = 1
            for i, page in enumerate(pdf_reader.pages):
                text = page.extract_text()
                if text:
                    page_num = i + 1
                    raw_document_segments.append({"page": page_num, "text": text})
                    numbered_lines = []
                    for line in text.split('\n'):
                        if line.strip():
                            numbered_lines.append(f"[Line {line_counter}] {line}")
                        else:
                            numbered_lines.append("")
                        line_counter += 1
                    raw_text += f"\n--- [PAGE {page_num}] ---\n" + "\n".join(numbered_lines) + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    else:
        # Fallback basic text decoder
        try:
            raw_text = content.decode("utf-8", errors="ignore")
        except Exception:
            raw_text = str(content)
        raw_document_segments.append({"page": 1, "text": raw_text})

    print(f"--- Received Document: {file.filename} ({len(raw_text)} chars) ---")
    if prompt:
        # Append user prompt intent to start of the doc (or handle it in state)
        raw_text = f"USER INTENT: {prompt}\n\nDOCUMENT BODY:\n{raw_text}"

    initial_state = {
        "raw_document": raw_text,
        "raw_document_segments": raw_document_segments,
        "analysis_report": [],
        "audit_results": [],
        "detected_drift": [],
        "compliance_score": 0,
        "final_report": {},
        "next_agent": ""
    }
    
    try:
        final_state = compliance_graph.invoke(initial_state)
        report = final_state.get("final_report", {})
        print("--- LangGraph Audit Complete ---")
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

class ReviseRequest(BaseModel):
    raw_document: str
    prompt: str
    chat_history: list
    raw_document_segments: list = []
    analysis_report: list = []

@app.post("/revise")
async def revise_analysis(req: ReviseRequest):
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
        import json
        
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
        
        system_prompt = """You are an elite Legal & Compliance AI Assistant. 
You strictly follow the "Anchor Principle":
Rule 1: Every answer must begin by referencing a specific part of the uploaded document or the specific verdict from the Analyst/Judge Agent. Use Markdown citations (e.g., `(Ref: Clause 4.1, Page 4)` or `(Ref: Analyst Finding - Data Localization)`).
Rule 2: Prohibit generic legal advice. If a user asks "Can I use this commercially?", you must check the specific "Scope of Use" clause extracted by the Analyst, and the original document text.
Rule 3: If the answer cannot be found in the analysis OR the document body, you must heavily reject by stating EXACTLY: "Based strictly on the current audit of the provided document, this information is not specified." But if you CAN find the answer in the document, quote it!
Rule 4: If the user asks why the document is compliant or asks for top reasons, you MUST refer to the successful 'Compliant' findings in the analysis report. If the analysis report doesn't contain enough reasons (e.g. they ask for 10), you MUST actively scan the DOCUMENT BODY to extract additional compliant clauses and explain why they meet Indian laws. NEVER reject a request for reasons of compliance if the document itself is available; always find the reasons in the text.

ANALYSIS REPORT:
{analysis_report}

DOCUMENT BODY:
{doc}"""
        
        analysis_str = json.dumps(req.analysis_report, indent=2) if req.analysis_report else "No specific audit findings provided."
        sys_msg_content = system_prompt.replace("{doc}", req.raw_document).replace("{analysis_report}", analysis_str)
        
        messages = [SystemMessage(content=sys_msg_content)]
        
        # Inject Few-Shot Examples
        messages.extend([
            HumanMessage(content="Is there a clause about delayed payments?"),
            AIMessage(content="(Ref: Section 3.2, Page 2) Yes. The document states that any payment delayed beyond 30 days will incur an 18% annual interest penalty."),
            HumanMessage(content="Can I use the software commercially?"),
            AIMessage(content="(Ref: Clause 4.1, Page 4) The scope of use clause explicitly prohibits commercial usage without prior written consent from the licensor."),
            HumanMessage(content="What happens if there's a force majeure?"),
            AIMessage(content="Based strictly on the current audit of the provided document, this information is not specified.")
        ])
        
        for msg in req.chat_history:
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg.get("content", "")))
                
        messages.append(HumanMessage(content=req.prompt))
        
        response = llm.invoke(messages)
        
        return {"reply": response.content}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Revision failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8088, reload=True)
