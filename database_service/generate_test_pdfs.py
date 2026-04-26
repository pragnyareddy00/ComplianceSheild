import csv
import os
from pathlib import Path
from fpdf import FPDF

csv_path = Path(r"c:\Users\ruthvik\OneDrive\Documents\NMIMS\Major Project\ComplianceSheild\database_service\ground_truth.csv")
output_dir = Path(r"c:\Users\ruthvik\OneDrive\Documents\NMIMS\Major Project\ComplianceSheild\database_service\test_documents")

def create_pdfs():
    # Make sure output directories exist
    compliant_dir = output_dir / "compliant"
    non_compliant_dir = output_dir / "non_compliant"
    compliant_dir.mkdir(parents=True, exist_ok=True)
    non_compliant_dir.mkdir(parents=True, exist_ok=True)
    
    with open(csv_path, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        
        comp_count = 0
        non_comp_count = 0
        for row in reader:
            doc_name = row["doc_id"]
            clause_text = row["clause_text"]
            statute_ref = row["statute_ref"]
            verdict = row["expected_verdict"]
            
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            
            # Title
            pdf.set_font("Arial", 'B', 16)
            pdf.cell(200, 10, txt="LEGAL CONTRACT", ln=True, align='C')
            pdf.ln(10)
            
            # Boilerplate Body
            pdf.set_font("Arial", size=12)
            body = (
                "This is a legally binding agreement between the parties involved. "
                "The terms outlined in this document are strictly enforceable by law.\n\n"
                "1. CONFIDENTIALITY\n"
                "Both parties agree to maintain strict confidentiality regarding all shared assets.\n\n"
                "2. JURISDICTION\n"
                "This contract relies on the standard compliance measures of the governing laws.\n\n"
                "3. SPECIFIC COMPLIANCE CLAUSE [IMPORTANT]\n"
            )
            pdf.multi_cell(0, 10, txt=body)
            
            # The injected clause extracted from our Mock Ground Truth
            pdf.set_font("Arial", 'B', 12)
            pdf.multi_cell(0, 10, txt=clause_text)
            
            pdf.ln(10)
            pdf.set_font("Arial", size=10)
            pdf.cell(0, 10, txt=f"Related to: {statute_ref}", ln=True)
            
            # Save file in isolated directories
            if verdict == "Compliant":
                output_path = compliant_dir / doc_name
                comp_count += 1
            else:
                output_path = non_compliant_dir / doc_name
                non_comp_count += 1
                
            pdf.output(str(output_path))
            print(f"Generated ({verdict}): {doc_name}")
            
        print(f"\nSuccessfully generated {comp_count} Compliant PDFs in: {compliant_dir}")
        print(f"Successfully generated {non_comp_count} Non-Compliant PDFs in: {non_compliant_dir}")

if __name__ == "__main__":
    create_pdfs()
