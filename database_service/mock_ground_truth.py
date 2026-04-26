import csv
import random
from pathlib import Path

csv_path = Path(r"c:\Users\ruthvik\OneDrive\Documents\NMIMS\Major Project\ComplianceSheild\database_service\ground_truth.csv")
csv_headers = ["doc_id", "clause_text", "statute_ref", "extracted_value", "statutory_limit", "expected_verdict", "math_check_result"]

laws_pool = [
    ("DPDP Act Section 8", "Data Retention Days", 45),
    ("Companies Act Section 134", "Board Report Submission Days", 30),
    ("IT Rules 2021", "Grievance Response Hours", 24),
    ("Consumer Protection Act", "Refund Processing Days", 14),
    ("FEMA Guidelines", "FDI Reporting Days", 30),
    ("RBI Data Localization", "Payment Data Storage Verification Days", 180)
]

def generate_records():
    records = []
    
    # Generate 18 Compliant Records
    for i in range(1, 19):
        doc_name = f"Legal_Agreement_Batch_A_{i:02d}.pdf"
        law = random.choice(laws_pool)
        statute_ref, context, limit = law
        
        # Compliant logic (Value <= Limit)
        val = random.randint(1, limit)
        clause = f"The company shall abide by {context} specifically set at {val}."
        verdict = "Compliant"
        math_check = f"Extracted ({val}) <= Statute ({limit})"
        
        records.append({
            "doc_id": doc_name,
            "clause_text": clause,
            "statute_ref": statute_ref,
            "extracted_value": val,
            "statutory_limit": limit,
            "expected_verdict": verdict,
            "math_check_result": math_check
        })

    # Generate 18 Non-Compliant Records
    for i in range(1, 19):
        doc_name = f"Legal_Agreement_Batch_B_{i:02d}.pdf"
        law = random.choice(laws_pool)
        statute_ref, context, limit = law
        
        # Non-Compliant logic (Value > Limit)
        val = random.randint(limit + 1, limit + 90)
        clause = f"The {context} is agreed by both parties to be {val}."
        verdict = "Non-Compliant"
        math_check = f"Extracted ({val}) > Statute ({limit})"
        
        records.append({
            "doc_id": doc_name,
            "clause_text": clause,
            "statute_ref": statute_ref,
            "extracted_value": val,
            "statutory_limit": limit,
            "expected_verdict": verdict,
            "math_check_result": math_check
        })
        
    return records

if __name__ == "__main__":
    records = generate_records()
    
    print(f"Writing {len(records)} records to {csv_path}...")
    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_headers)
        writer.writeheader()
        writer.writerows(records)
    print("MOCK DATA SUCCESSFULLY GENERATED.")
