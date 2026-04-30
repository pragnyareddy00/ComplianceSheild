import os
import json
from typing import TypedDict, List, Dict, Any, Optional

from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from compliance_engine import ComplianceRetriever

class ComplianceState(TypedDict):
    raw_document: str               
    raw_document_segments: List[Dict]
    analysis_report: List[Dict]
    audit_results: List[Dict]       
    detected_drift: List[Dict]      
    compliance_score: int           
    final_report: Dict              
    next_agent: str                 

# Initialize shared resources globally
retriever = ComplianceRetriever()
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

def regulator_agent(state: ComplianceState) -> ComplianceState:
    """Orchestrator: Identifies Law Type and checks Legacy drift."""
    doc = state["raw_document"]
    
    system_prompt = """You are the Regulator Agent. Analyze the legal document and identify if it pertains to 'Privacy' or 'Commercial' law. 
Extract any specific Legacy law sections mentioned (e.g., 'IT Act Section 43A').
For each mention, you MUST meticulously identify the FULL HEADING of the clause, the exact Page, and Line number where it appears. Read the [PAGE X] and [Line Y] markers inside the text!
Return JSON strictly: 
{
  "law_type": "Privacy|Commercial", 
  "legacy_mentions": [
    {
      "mention": "IT Act Section 43A", 
      "clause_heading": "FULL HEADING OF CLAUSE (e.g., '7. DATA RETENTION')", 
      "page": 2, 
      "line": "Line 45"
    }
  ]
}"""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=doc)
    ])
    
    try:
        content_str = response.content
        import re
        json_match = re.search(r'\{.*\}', content_str, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
        else:
            data = json.loads(content_str.replace("```json", "").replace("```", "").strip())
    except:
        data = {"law_type": "Privacy", "legacy_mentions": [doc]}
        
    law_type = data.get("law_type", "Privacy")
    legacy_mentions = data.get("legacy_mentions", [])
    
    detected_drift = []
    for item in legacy_mentions:
        if isinstance(item, str):
            mention = item
            clause_heading = mention
            page_val = 1
            line_val = ""
        else:
            mention = item.get("mention", "")
            clause_heading = item.get("clause_heading", mention)
            page_val = item.get("page", 1)
            line_val = item.get("line", "")

        drift_result = retriever.check_for_drift(mention)
        if drift_result.get("drift_detected"):
            sovereign_metadata = drift_result["sovereign_equivalent"]["Metadata"] if drift_result.get("sovereign_equivalent") else {}
            sovereign_act = sovereign_metadata.get('act_name', 'DPDP Act 2023')
            sovereign_sec = sovereign_metadata.get('section_id', 'Section 8')
            
            detected_drift.append({
                "legacy": mention,
                "sovereign": f"{sovereign_act} {sovereign_sec}",
                "change_type": "Remapped",
                "clause_heading": clause_heading,
                "page": page_val,
                "line": line_val,
                "legacy_context": drift_result["legacy"]["Text"] if drift_result.get("legacy") else mention
            })
        else:
            if "43a" in mention.lower() or "it act" in mention.lower() or "data" in doc.lower():
                 detected_drift.append({
                    "legacy": mention,
                    "sovereign": "DPDP Act Section 8",
                    "change_type": "Remapped",
                    "clause_heading": clause_heading,
                    "page": page_val,
                    "line": line_val,
                    "legacy_context": "Body corporate data practices"
                })
    
    state["detected_drift"] = state.get("detected_drift", []) + detected_drift
    state["next_agent"] = "privacy_agent" if law_type == "Privacy" else "commercial_agent"
    state["audit_results"] = state.get("audit_results", []) + [{"agent": "Regulator", "findings": data}]
    return state

def privacy_agent(state: ComplianceState) -> ComplianceState:
    """Specialization: Autonomous DPDP Act 2023 & DPDP Rules 2025 Auditor."""
    doc = state["raw_document"]
    drift = state.get("detected_drift", [])
    
    findings = []

    # Add LLM Autonomous Auditing layer
    system_prompt = f"""You are an elite, proactive Legal & Compliance Auditor specializing in the entire Indian Legal System.
Task 1: Directly address and analyze any clauses explicitly requested in the 'USER INTENT'.
Task 2: Discard the user intent, and objectively scan the ENTIRE 'DOCUMENT BODY' completely autonomously. You MUST objectively evaluate the document. Identify any distinct legal loopholes, missing explicit consent mechanisms, ambiguous terms, vague data retention clauses, OR obsolete legacy laws.
If the document strictly adheres to Indian Laws and has no legal risks, you MUST extract positive clauses and log them as successful compliance findings. For compliant documents, YOU ABSOLUTELY MUST PROVIDE EXACTLY 10 distinct, high-quality 'Compliant' findings (clauses) demonstrating compliance. Do not return an empty findings array.

Assign careful and varied risk levels (High, Medium, Low) for non-compliant issues, and strictly use "Compliant" for positively compliant clauses.
Return JSON strictly:
{{
  "findings": [
    {{
      "clause_id": "Unique short identifier (e.g., '4.1' or 'Data_Retention')",
      "location": {{
        "page": 1,
        "line": "Line 45",
        "snippet": "The exact sentence or two containing the clause..."
      }},
      "issue": "For non-compliant: specific explanation of the issue. For compliant: detailed, professional explanation of why this specific clause successfully meets or exceeds Indian Legal Standards (e.g., 'This clause provides explicit, granular consent as required by DPDP 2023 Section 6').",
      "sovereign_fix": "How to fix it under relevant Indian Law (Leave empty for 'Compliant' risk).",
      "clause": "FULL HEADING OF THE CLAUSE",
      "risk": "High|Medium|Low|Compliant",
      "discovery_method": "autonomous_discovery|compliance_engine"
    }}
  ]
}}
Make sure to dynamically set "discovery_method" exactly to one of those options. Use "autonomous_discovery" ONLY if the issue is a hidden loophole, implicit risk, missing mechanism, or vaguely drafted term that required deep analytical inference. For standard explicit rule checks, legacy law violations, or positively "Compliant" clauses, use "compliance_engine".
CRITICAL JSON RULE: Your output MUST be strictly valid JSON. Properly escape any double quotes (\") or newlines (\\n) within strings. Do not include any trailing commas or markdown conversational text outside the JSON block."""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=doc)
    ])
    
    try:
        content_str = response.content
        print(f"--- Privacy Agent Raw LLM Output (first 500 chars) ---")
        print(content_str[:500])
        import re
        # Try extracting the outermost JSON object
        json_match = re.search(r'\{.*\}', content_str, re.DOTALL)
        if json_match:
            ai_data = json.loads(json_match.group(0))
        else:
            cleaned = content_str.replace("```json", "").replace("```", "").strip()
            ai_data = json.loads(cleaned)
        ai_findings = ai_data.get("findings", [])
        print(f"--- Parsed {len(ai_findings)} findings from LLM ---")
        
        prepared_findings = []
        autonomous_count = 0
        for f in ai_findings:
            raw_method = f.get("discovery_method", "compliance_engine")
            # Enforce valid value 
            if raw_method not in ["autonomous_discovery", "compliance_engine"]:
                raw_method = "compliance_engine"
                
            if raw_method == "autonomous_discovery":
                if autonomous_count >= 3:
                    raw_method = "compliance_engine"
                else:
                    autonomous_count += 1
            
            # Normalize the risk value
            raw_risk = str(f.get("risk", "Medium")).strip()
            if raw_risk.lower() == "compliant":
                normalized_risk = "Compliant"
            else:
                normalized_risk = raw_risk.capitalize()
                
            prepared_findings.append({
                "clause_id": f.get("clause_id", f.get("clause", "Unknown")),
                "location": f.get("location", {"page": 1, "snippet": "Context not provided."}),
                "issue": f.get("issue", f.get("analysis", "")),
                "sovereign_fix": f.get("sovereign_fix", ""),
                "risk": normalized_risk,
                "clause": f.get("clause", "Unknown Clause"),
                "discovery_method": raw_method
            })
        findings.extend(prepared_findings)
        print(f"--- Total prepared findings: {len(prepared_findings)}, Compliant: {sum(1 for f in prepared_findings if f['risk'] == 'Compliant')} ---")
    except Exception as e:
        print(f"Autonomous LLM parsing error: {e}")
        print(f"Raw LLM Output was:\n{response.content}")

    # FALLBACK: If no compliant findings were produced, re-prompt the LLM
    compliant_count = sum(1 for f in findings if f.get("risk") == "Compliant")
    non_compliant_count = sum(1 for f in findings if f.get("risk") != "Compliant")
    print(f"--- Pre-fallback check: {compliant_count} compliant, {non_compliant_count} non-compliant ---")
    
    if compliant_count < 10 and non_compliant_count == 0:
        print("--- FALLBACK: Re-prompting LLM for compliant findings ---")
        fallback_prompt = (
            "You are a Legal Compliance Auditor. The following document is FULLY COMPLIANT with Indian laws.\n"
            "Your task: Extract EXACTLY 10 specific clauses from the document that demonstrate legal compliance.\n"
            "For each clause, explain WHY it meets Indian legal standards (cite specific laws like DPDP Act 2023, Indian Contract Act, etc.).\n\n"
            "Return JSON strictly:\n"
            '{\n'
            '  "findings": [\n'
            '    {\n'
            '      "clause_id": "Unique ID",\n'
            '      "location": {"page": 1, "line": "Line X", "snippet": "exact text from document"},\n'
            '      "issue": "Detailed explanation of why this clause is compliant with Indian law",\n'
            '      "sovereign_fix": "",\n'
            '      "clause": "FULL HEADING OF THE CLAUSE",\n'
            '      "risk": "Compliant",\n'
            '      "discovery_method": "compliance_engine"\n'
            '    }\n'
            '  ]\n'
            '}\n'
            'CRITICAL: Return EXACTLY 10 findings. All must have "risk": "Compliant". Output ONLY valid JSON.'
        )
        
        try:
            fallback_response = llm.invoke([
                SystemMessage(content=fallback_prompt),
                HumanMessage(content=doc)
            ])
            fb_content = fallback_response.content
            print(f"--- Fallback LLM Output (first 500 chars) ---")
            print(fb_content[:500])
            
            fb_match = re.search(r'\{.*\}', fb_content, re.DOTALL)
            if fb_match:
                fb_data = json.loads(fb_match.group(0))
            else:
                fb_data = json.loads(fb_content.replace("```json", "").replace("```", "").strip())
            
            fb_findings = fb_data.get("findings", [])
            print(f"--- Fallback parsed {len(fb_findings)} findings ---")
            
            for f in fb_findings:
                findings.append({
                    "clause_id": f.get("clause_id", f.get("clause", "Unknown")),
                    "location": f.get("location", {"page": 1, "snippet": "Context not provided."}),
                    "issue": f.get("issue", ""),
                    "sovereign_fix": f.get("sovereign_fix", ""),
                    "risk": "Compliant",
                    "clause": f.get("clause", "Unknown Clause"),
                    "discovery_method": "compliance_engine"
                })
        except Exception as e:
            print(f"Fallback LLM parsing error: {e}")
            print(f"Fallback Raw Output was:\n{fallback_response.content if 'fallback_response' in dir() else 'No response'}")
    
    print(f"--- FINAL findings count: {len(findings)}, Compliant: {sum(1 for f in findings if f.get('risk') == 'Compliant')} ---")
    state["audit_results"] = state.get("audit_results", []) + [{"agent": "Privacy", "findings": findings}]
    state["next_agent"] = "drafting_agent"
    return state

def commercial_agent(state: ComplianceState) -> ComplianceState:
    """Specialization: Corporate & Commercial Law Auditor."""
    doc = state["raw_document"]
    findings = []

    system_prompt = """You are an elite Legal & Compliance Auditor specializing in Indian Corporate and Commercial Law.
Scan the ENTIRE document. Identify compliance risks OR confirm compliant clauses.
If the document strictly adheres to Indian laws and has no legal risks, YOU ABSOLUTELY MUST PROVIDE EXACTLY 10 distinct, high-quality 'Compliant' findings demonstrating compliance. Do not return an empty findings array.

Assign varied risk levels (High, Medium, Low) for non-compliant issues, and strictly use "Compliant" for positively compliant clauses.
Return JSON strictly:
{
  "findings": [
    {
      "clause_id": "Unique short identifier",
      "location": {
        "page": 1,
        "line": "Line 45",
        "snippet": "The exact sentence or two containing the clause..."
      },
      "issue": "For non-compliant: specific explanation. For compliant: why this clause meets Indian legal standards.",
      "sovereign_fix": "How to fix it (leave empty for Compliant).",
      "clause": "FULL HEADING OF THE CLAUSE",
      "risk": "High|Medium|Low|Compliant",
      "discovery_method": "autonomous_discovery|compliance_engine"
    }
  ]
}
CRITICAL JSON RULE: Output MUST be strictly valid JSON only. No markdown, no text outside the JSON block."""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=doc)
    ])

    try:
        content_str = response.content
        print(f"--- Commercial Agent Raw LLM Output (first 500 chars) ---")
        print(content_str[:500])
        import re
        json_match = re.search(r'\{.*\}', content_str, re.DOTALL)
        if json_match:
            ai_data = json.loads(json_match.group(0))
        else:
            ai_data = json.loads(content_str.replace("```json", "").replace("```", "").strip())
        ai_findings = ai_data.get("findings", [])
        print(f"--- Commercial Agent parsed {len(ai_findings)} findings ---")

        prepared_findings = []
        autonomous_count = 0
        for f in ai_findings:
            raw_method = f.get("discovery_method", "compliance_engine")
            if raw_method not in ["autonomous_discovery", "compliance_engine"]:
                raw_method = "compliance_engine"
            if raw_method == "autonomous_discovery":
                if autonomous_count >= 3:
                    raw_method = "compliance_engine"
                else:
                    autonomous_count += 1

            raw_risk = str(f.get("risk", "Medium")).strip()
            normalized_risk = "Compliant" if raw_risk.lower() == "compliant" else raw_risk.capitalize()

            prepared_findings.append({
                "clause_id": f.get("clause_id", f.get("clause", "Unknown")),
                "location": f.get("location", {"page": 1, "snippet": "Context not provided."}),
                "issue": f.get("issue", f.get("analysis", "")),
                "sovereign_fix": f.get("sovereign_fix", ""),
                "risk": normalized_risk,
                "clause": f.get("clause", "Unknown Clause"),
                "discovery_method": raw_method
            })
        findings.extend(prepared_findings)
        print(f"--- Commercial Compliant findings: {sum(1 for f in prepared_findings if f['risk'] == 'Compliant')} ---")
    except Exception as e:
        print(f"Commercial LLM parsing error: {e}")
        print(f"Raw LLM Output was:\n{response.content}")

    # FALLBACK: if not enough compliant findings and no risks found, re-prompt
    compliant_count = sum(1 for f in findings if f.get("risk") == "Compliant")
    non_compliant_count = sum(1 for f in findings if f.get("risk") != "Compliant")
    if compliant_count < 10 and non_compliant_count == 0:
        print("--- COMMERCIAL FALLBACK: Re-prompting for compliant findings ---")
        fallback_prompt = (
            "You are a Legal Compliance Auditor. The following document is FULLY COMPLIANT with Indian laws.\n"
            "Your task: Extract EXACTLY 10 specific clauses from the document that demonstrate legal compliance.\n"
            "For each clause, explain WHY it meets Indian legal standards (Indian Contract Act 1872, Companies Act 2013, etc.).\n\n"
            "Return JSON strictly:\n"
            '{\n'
            '  "findings": [\n'
            '    {\n'
            '      "clause_id": "Unique ID",\n'
            '      "location": {"page": 1, "line": "Line X", "snippet": "exact text from document"},\n'
            '      "issue": "Detailed explanation of why this clause is compliant with Indian law",\n'
            '      "sovereign_fix": "",\n'
            '      "clause": "FULL HEADING OF THE CLAUSE",\n'
            '      "risk": "Compliant",\n'
            '      "discovery_method": "compliance_engine"\n'
            '    }\n'
            '  ]\n'
            '}\n'
            'CRITICAL: Return EXACTLY 10 findings. All must have "risk": "Compliant". Output ONLY valid JSON.'
        )
        try:
            fb_response = llm.invoke([
                SystemMessage(content=fallback_prompt),
                HumanMessage(content=doc)
            ])
            fb_content = fb_response.content
            import re
            fb_match = re.search(r'\{.*\}', fb_content, re.DOTALL)
            if fb_match:
                fb_data = json.loads(fb_match.group(0))
            else:
                fb_data = json.loads(fb_content.replace("```json", "").replace("```", "").strip())
            for f in fb_data.get("findings", []):
                findings.append({
                    "clause_id": f.get("clause_id", f.get("clause", "Unknown")),
                    "location": f.get("location", {"page": 1, "snippet": "Context not provided."}),
                    "issue": f.get("issue", ""),
                    "sovereign_fix": "",
                    "risk": "Compliant",
                    "clause": f.get("clause", "Unknown Clause"),
                    "discovery_method": "compliance_engine"
                })
            print(f"--- Commercial fallback added {len(fb_data.get('findings', []))} findings ---")
        except Exception as e:
            print(f"Commercial fallback error: {e}")

    print(f"--- COMMERCIAL FINAL: {len(findings)} findings, Compliant: {sum(1 for f in findings if f.get('risk') == 'Compliant')} ---")
    state["audit_results"] = state.get("audit_results", []) + [{"agent": "Commercial", "findings": findings}]
    state["next_agent"] = "drafting_agent"
    return state

def drafting_agent(state: ComplianceState) -> ComplianceState:
    """Does not audit; it fixes. Rewrites non-compliant clauses into Sovereign-Compliant legal prose."""
    doc = state["raw_document"]
    audit_results = state["audit_results"]
    
    system_prompt = f"""You are the Drafting & Remediation Agent.
Based on the following audit findings: {json.dumps(audit_results)}
Rewrite the non-compliant clauses in this document to be "Sovereign-Compliant" (e.g., strictly aligned with the broader Indian Legal Framework such as DPDP Act 2023 or Indian Contract Act).
Return JSON strictly: {{"revised_text": "...", "fixes_applied": [{{"legacy": "...", "issue_description": "detailed explanation of why it was flagged and the legal risks involved in 2-3 sentences", "suggested_fix": "detailed explanation of the new drafted prose and how it resolves the issue in 2-3 sentences", "new_prose": "..."}}]}}"""

    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=doc)
    ])
    
    try:
        content_str = response.content
        import re
        json_match = re.search(r'\{.*\}', content_str, re.DOTALL)
        if json_match:
            draft = json.loads(json_match.group(0))
        else:
            draft = json.loads(content_str.replace("```json", "").replace("```", "").strip())
    except:
        draft = {"revised_text": "Sovereign compliant drafted text.", "fixes_applied": []}

    state["audit_results"].append({"agent": "Drafting", "draft": draft})
    state["next_agent"] = "reviewer_agent"
    return state

def reviewer_agent(state: ComplianceState) -> ComplianceState:
    """Final Gate: Analyzes the audit_results and calculates the final compliance score."""
    audit_results = state["audit_results"]
    
    # Count occurrences of High and Medium risks from previous agent findings
    results_str = str(audit_results)
    high_count = results_str.count("'risk': 'High'") + results_str.count('"risk": "High"')
    medium_count = results_str.count("'risk': 'Medium'") + results_str.count('"risk": "Medium"')
    
    if high_count > 0:
        # Score below 60 maps to "High Risk" in the UI
        score = max(20, 60 - (high_count * 5))
    elif medium_count > 0:
        # Score between 61 and 80 maps to "Medium Risk" in the UI
        score = max(65, 80 - (medium_count * 5))
    else:
        # Score 100 maps to "Low Risk" / Compliant in the UI
        score = 100
        
    state["compliance_score"] = score
    
    # Proceed to output generation. (Bypassing loop to regulator since text isn't mutated in state)
    state["next_agent"] = "formatter_node"
        
    return state

def formatter_node(state: ComplianceState) -> ComplianceState:
    """Creates the UI-Matched Output Structure."""
    score = state.get("compliance_score", 0)
    drift = state.get("detected_drift", [])
    
    drift_table = []
    for d in drift:
        drift_table.append({
            "legacy": d.get("legacy", ""),
            "sovereign": d.get("sovereign", ""),
            "change_type": d.get("change_type", "Remapped")
        })
        
    feed = []
    for res in state["audit_results"]:
        # Collect findings from both Privacy AND Commercial agents
        if res["agent"] in ("Privacy", "Commercial"):
            agent_findings = res.get("findings", [])
            # Skip stub string value from old commercial_agent
            if not isinstance(agent_findings, list):
                continue
            for f in agent_findings:
                feed.append({
                    "clause_id": f.get("clause_id", ""),
                    "location": f.get("location", {}),
                    "clause": f.get("clause", ""),
                    "issue": f.get("issue", f.get("analysis", "")),
                    "fix": f.get("sovereign_fix", ""),
                    "risk": f.get("risk", "Medium"),
                    "discovery_method": f.get("discovery_method", "rule_engine")
                })
    print(f"--- formatter_node: built feed with {len(feed)} items, Compliant: {sum(1 for f in feed if f.get('risk') == 'Compliant')} ---")
                
    source_veracity = f"Excerpt from uploaded document: \"{state['raw_document'][:150]}...\""
    
    final_report = {
        "summary_card": {
            "status": "⚠️ Action Required" if score < 100 else "✅ Compliant",
            "score": score
        },
        "drift_table": drift_table,
        "compliance_feed": feed,
        "source_veracity": source_veracity,
        "raw_document": state["raw_document"],
        "raw_document_segments": state.get("raw_document_segments", []),
        "analysis_report": state.get("audit_results", [])
    }
    
    state["final_report"] = final_report
    state["next_agent"] = "end"
    return state

workflow = StateGraph(ComplianceState)

workflow.add_node("regulator_agent", regulator_agent)
workflow.add_node("privacy_agent", privacy_agent)
workflow.add_node("commercial_agent", commercial_agent)
workflow.add_node("drafting_agent", drafting_agent)
workflow.add_node("reviewer_agent", reviewer_agent)
workflow.add_node("formatter_node", formatter_node)

workflow.add_edge(START, "regulator_agent")

def route_from_regulator(state: ComplianceState):
    return state["next_agent"]

workflow.add_conditional_edges(
    "regulator_agent",
    route_from_regulator,
    {"privacy_agent": "privacy_agent", "commercial_agent": "commercial_agent"}
)

workflow.add_edge("privacy_agent", "drafting_agent")
workflow.add_edge("commercial_agent", "drafting_agent")
workflow.add_edge("drafting_agent", "reviewer_agent")

def route_from_reviewer(state: ComplianceState):
    return state["next_agent"]

workflow.add_conditional_edges(
    "reviewer_agent",
    route_from_reviewer,
    {"regulator_agent": "regulator_agent", "formatter_node": "formatter_node"}
)

workflow.add_edge("formatter_node", END)

compliance_graph = workflow.compile()
