import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_sunita_followup_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=45,
        bottomMargin=45
    )
    
    styles = getSampleStyleSheet()
    
    h1_style = ParagraphStyle(
        'HospitalHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        alignment=1,
        textColor=colors.black,
        spaceAfter=4
    )
    
    sub_header_style = ParagraphStyle(
        'ReportHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        alignment=1,
        textColor=colors.black,
        spaceAfter=18
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=16,
        textColor=colors.black,
        spaceBefore=10,
        spaceAfter=5
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14.5,
        textColor=colors.black
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        leftIndent=15,
        firstLineIndent=-10,
        textColor=colors.black
    )

    sub_bullet_style = ParagraphStyle(
        'SubBulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        leftIndent=28,
        textColor=colors.HexColor('#222222')
    )

    story = []

    # 1. Header
    story.append(Paragraph("Vasundhara Hospital, Ghaziabad", h1_style))
    story.append(Paragraph("Alzheimer's Disease Medical Report - Follow-Up Assessment", sub_header_style))

    # 2. Patient Details Table
    story.append(Paragraph("Patient Details:", section_style))
    table_data = [
        [Paragraph("<b>Name:</b>", body_style), Paragraph("Mrs. Sunita Sharma", body_style)],
        [Paragraph("<b>Age/Gender:</b>", body_style), Paragraph("69 years / Female", body_style)],
        [Paragraph("<b>Report Date:</b>", body_style), Paragraph("12 / 05 / 2027", body_style)]
    ]
    t = Table(table_data, colWidths=[100, 404])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))

    # 3. Consulting Physician
    story.append(Paragraph("Consulting Physician:", section_style))
    doc_table = [
        [Paragraph("<b>Doctor's Name:</b>", body_style), Paragraph("Dr. A. K. Banerjee", body_style)],
        [Paragraph("<b>Specialization:</b>", body_style), Paragraph("Neurology (Cognitive Disorders)", body_style)],
        [Paragraph("<b>Hospital / Clinic:</b>", body_style), Paragraph("Vasundhara Hospital, Ghaziabad", body_style)]
    ]
    t_doc = Table(doc_table, colWidths=[100, 404])
    t_doc.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_doc)
    story.append(Spacer(1, 8))

    # 4. Medical History
    story.append(Paragraph("Medical History (6-Month Interval Follow-Up):", section_style))
    history_items = [
        "Patient re-evaluated after 6 months; family reports accelerated memory loss and increased daily assistance needs.",
        "Unable to recognize grandchildren's names consistently; frequently misplaces essentials and accuses others of taking them.",
        "Disorientation expanded to indoor rooms at night; attempted wandering outside front door on two occasions.",
        "Increased emotional agitation during evenings (sundowning); requires continuous prompting for bathing and dressing."
    ]
    for h in history_items:
        story.append(Paragraph(f"• {h}", bullet_style))
    story.append(Spacer(1, 8))

    # 5. Physical & Cognitive Examination
    story.append(Paragraph("Physical & Cognitive Examination:", section_style))
    exam_items = [
        "Blood Pressure: 130/84 mmHg",
        "Pulse: 76 per minute",
        "Cognitive Test (MMSE Score): <b>15 / 30</b> (Moderate Stage Progression: -6 points drop from 21/30 on 10/11/2026)"
    ]
    for e in exam_items:
        story.append(Paragraph(f"• {e}", bullet_style))
    
    sub_scores = [
        "Orientation: 3 / 10 (Disoriented to date, year, season, and hospital department)",
        "Memory: 1 / 6 (Immediate registration 2/3, delayed recall 0/3 after distraction)",
        "Attention: 3 / 5 (Unable to complete serial subtractions without repeated cues)",
        "Language: 8 / 9 (Mild word-finding hesitation; reading comprehension reduced)"
    ]
    for s in sub_scores:
        story.append(Paragraph(f"• {s}", sub_bullet_style))
    story.append(Spacer(1, 8))

    # 6. Lab & Imaging Reports
    story.append(Paragraph("Lab & Imaging Reports:", section_style))
    lab_items = [
        "MRI Brain (Follow-Up): Moderate-to-severe bilateral hippocampal volume loss (MTA Grade 3), increased ventricular enlargement.",
        "Blood Tests: Routine metabolic panel, electrolytes, serum Vitamin B12 - Within normal limits.",
        "EEG: Moderate generalized background slowing in fronto-temporal regions consistent with progression."
    ]
    for l in lab_items:
        story.append(Paragraph(f"• {l}", bullet_style))
    story.append(Spacer(1, 8))

    # 7. Diagnosis
    story.append(Paragraph("Diagnosis:", section_style))
    story.append(Paragraph("Alzheimer's Disease (Moderate Stage, Active Progression).", body_style))
    story.append(Spacer(1, 8))

    # 8. Treatment Plan
    story.append(Paragraph("Treatment Plan:", section_style))
    treatment_items = [
        "Medications: Increase Donepezil to 10mg daily at bedtime + Add Memantine 10mg daily morning (titrate to 20mg after 2 weeks).",
        "Safety & Supervision: Full-time caregiver assistance recommended; install door sensors and safety locks.",
        "Behavioral Care: Maintain calm environment during evening hours; avoid confronting memory confusion.",
        "Follow-up: Neurological reassessment scheduled in 3-4 months."
    ]
    for idx, t_text in enumerate(treatment_items, 1):
        story.append(Paragraph(f"{idx}. {t_text}", bullet_style))
    story.append(Spacer(1, 8))

    # 9. Conclusion & Signature
    story.append(Paragraph("Conclusion:", section_style))
    story.append(Paragraph(
        "Follow-up examination confirms active disease progression over the 6-month period. Dual combination therapy "
        "(Donepezil + Memantine) has been initiated along with enhanced daily supervision to ensure patient safety and quality of life.",
        body_style
    ))
    story.append(Spacer(1, 24))

    sig_block = [
        Paragraph("___________________________", body_style),
        Paragraph("<b>Doctor's Signature:</b> Dr. A. K. Banerjee (MD, DM Neuro)", body_style),
        Paragraph("<b>Date:</b> 12 / 05 / 2027", body_style)
    ]
    story.append(KeepTogether(sig_block))

    doc.build(story)
    print(f"[OK] Follow-up PDF report created successfully at: {filename}")

if __name__ == "__main__":
    downloads_dir = "C:\\Users\\DELL\\Downloads"
    workspace_dir = "c:\\Users\\DELL\\OneDrive\\Desktop\\VMedithon-Radix"
    sample_reports_dir = os.path.join(workspace_dir, "sample_reports")
    public_reports_dir = os.path.join(workspace_dir, "public", "sample_reports")
    
    pdf_name = "Vasundhara_Hospital_Alzheimer_Report_Sunita_Sharma_FollowUp.pdf"

    dl_pdf = os.path.join(downloads_dir, pdf_name)
    generate_sunita_followup_pdf(dl_pdf)

    for d in [workspace_dir, sample_reports_dir, public_reports_dir]:
        generate_sunita_followup_pdf(os.path.join(d, pdf_name))
