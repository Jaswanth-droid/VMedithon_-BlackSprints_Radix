import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_filled_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=45,
        bottomMargin=45
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    h1_style = ParagraphStyle(
        'HospitalHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        alignment=1, # Center
        textColor=colors.black,
        spaceAfter=4
    )
    
    sub_header_style = ParagraphStyle(
        'ReportHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        alignment=1, # Center
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
    story.append(Paragraph("Alzheimer's Disease Medical Report", sub_header_style))

    # 2. Patient Details Table
    story.append(Paragraph("Patient Details:", section_style))
    
    table_data = [
        [Paragraph("<b>Name:</b>", body_style), Paragraph("Rajesh K. Verma", body_style)],
        [Paragraph("<b>Age/Gender:</b>", body_style), Paragraph("72 years / Male", body_style)],
        [Paragraph("<b>Report Date:</b>", body_style), Paragraph("14 / 09 / 2026", body_style)]
    ]
    
    t = Table(table_data, colWidths=[110, 394])
    t.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('INNERGRID', (0,0), (-1,-1), 0.75, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))

    # 3. Consulting Physician
    story.append(Paragraph("Consulting Physician:", section_style))
    story.append(Paragraph("Dr. A. K. Banerjee, MD (DM Neurology)", body_style))
    story.append(Paragraph("Specialization: Neurology", body_style))
    story.append(Paragraph("Hospital: Vasundhara Hospital, Ghaziabad", body_style))
    story.append(Spacer(1, 8))

    # 4. Medical History
    story.append(Paragraph("Medical History:", section_style))
    story.append(Paragraph("- Memory decline since 14 months (worsening episodic memory loss reported by spouse).", bullet_style))
    story.append(Paragraph("- Frequently forgets objects, names, dates, or directions in familiar neighborhood.", bullet_style))
    story.append(Paragraph("- Behavioral changes and difficulty in decision making / managing household finances.", bullet_style))
    story.append(Paragraph("- Sleep disturbances and mood changes observed (evening anxiety, restless sleep).", bullet_style))
    story.append(Spacer(1, 8))

    # 5. Physical & Cognitive Examination
    story.append(Paragraph("Physical & Cognitive Examination:", section_style))
    story.append(Paragraph("- Blood Pressure: 132/84 mmHg", bullet_style))
    story.append(Paragraph("- Pulse: 74 per minute", bullet_style))
    story.append(Paragraph("- Cognitive Test (MMSE Score): <b>19 / 30</b> (Decline from previous score of 24/30)", bullet_style))
    story.append(Paragraph("&bull; Orientation: 5 / 10 (disoriented to date and month)", sub_bullet_style))
    story.append(Paragraph("&bull; Memory: 2 / 6 (impaired 3-word delayed recall)", sub_bullet_style))
    story.append(Paragraph("&bull; Attention: 3 / 5 (difficulty with serial 7s)", sub_bullet_style))
    story.append(Paragraph("&bull; Language: 9 / 9 (naming and comprehension intact)", sub_bullet_style))
    story.append(Spacer(1, 8))

    # 6. Lab & Imaging Reports
    story.append(Paragraph("Lab & Imaging Reports:", section_style))
    story.append(Paragraph("- <b>MRI Brain:</b> Hippocampal atrophy / cortical sulci widening (MTA Score: Grade 2 bilateral hippocampal volume reduction)", bullet_style))
    story.append(Paragraph("- <b>Blood Tests:</b> Thyroid profile (TSH: 2.1 mIU/L - Normal), Vitamin B12 (420 pg/mL - Normal), Blood sugar (HbA1c: 5.7% - Normal)", bullet_style))
    story.append(Paragraph("- <b>EEG:</b> Mild slowing of theta wave activity in bilateral fronto-temporal regions; no epileptiform discharges", bullet_style))
    story.append(Spacer(1, 8))

    # 7. Diagnosis
    story.append(Paragraph("Diagnosis:", section_style))
    story.append(Paragraph("<b>Alzheimer's Disease (Moderate stage)</b> &mdash; Progressive neurodegenerative course with longitudinal cognitive decline.", body_style))
    story.append(Spacer(1, 8))

    # 8. Treatment Plan
    story.append(Paragraph("Treatment Plan:", section_style))
    story.append(Paragraph("1. <b>Medications:</b> Donepezil 10mg once daily (OD) post dinner; Memantine 10mg twice daily (BD) with titration.", bullet_style))
    story.append(Paragraph("2. <b>Lifestyle & Family Support:</b> Regular cognitive exercises, structured visual routines, balanced Mediterranean diet, light daily physical exercise, active family supervision.", bullet_style))
    story.append(Paragraph("3. <b>Follow-up:</b> Every 3&ndash;6 months with neurologist for monitoring of cognitive trajectory and treatment response.", bullet_style))
    story.append(Spacer(1, 8))

    # 9. Conclusion
    story.append(Paragraph("Conclusion:", section_style))
    story.append(Paragraph("Patient has been diagnosed with Alzheimer's Disease. It is a progressive condition, but with proper treatment, cognitive rehabilitation, and compassionate care, progression can be slowed, and quality of life can be improved.", body_style))
    story.append(Spacer(1, 20))

    # 10. Doctor's Signature
    sig_block = [
        Paragraph("___________________________", body_style),
        Paragraph("<b>Dr. A. K. Banerjee</b> (MD, DM Neuro)", body_style),
        Paragraph("Consultant Neurologist, Reg. No: MCI-48291", body_style),
        Paragraph("Doctor's Signature", body_style),
        Paragraph("Date: 14 / 09 / 2026", body_style)
    ]
    story.append(KeepTogether(sig_block))

    doc.build(story)
    print(f"Generated: {filename}")


def generate_template_pdf(filename):
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
        textColor=colors.black
    )

    story = []

    # 1. Header
    story.append(Paragraph("Vasundhara Hospital, Ghaziabad", h1_style))
    story.append(Paragraph("Alzheimer's Disease Medical Report", sub_header_style))

    # 2. Patient Details Table
    story.append(Paragraph("Patient Details:", section_style))
    
    table_data = [
        [Paragraph("Name:", body_style), Paragraph("____________________________________________", body_style)],
        [Paragraph("Age/Gender:", body_style), Paragraph("________ years / Male / Female", body_style)],
        [Paragraph("Report Date:", body_style), Paragraph("__ / __ / 20__", body_style)]
    ]
    
    t = Table(table_data, colWidths=[110, 394])
    t.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('INNERGRID', (0,0), (-1,-1), 0.75, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))

    # 3. Consulting Physician
    story.append(Paragraph("Consulting Physician:", section_style))
    story.append(Paragraph("Dr. __________________________________", body_style))
    story.append(Paragraph("Specialization: Neurology", body_style))
    story.append(Paragraph("Hospital: Vasundhara Hospital, Ghaziabad", body_style))
    story.append(Spacer(1, 8))

    # 4. Medical History
    story.append(Paragraph("Medical History:", section_style))
    story.append(Paragraph("- Memory decline since _____ months/years.", bullet_style))
    story.append(Paragraph("- Frequently forgets objects, names, dates, or directions.", bullet_style))
    story.append(Paragraph("- Behavioral changes and difficulty in decision making.", bullet_style))
    story.append(Paragraph("- Sleep disturbances and mood changes observed.", bullet_style))
    story.append(Spacer(1, 8))

    # 5. Physical & Cognitive Examination
    story.append(Paragraph("Physical & Cognitive Examination:", section_style))
    story.append(Paragraph("- Blood Pressure: ________ mmHg", bullet_style))
    story.append(Paragraph("- Pulse: ________ per minute", bullet_style))
    story.append(Paragraph("- Cognitive Test (MMSE Score): ___ / 30", bullet_style))
    story.append(Paragraph("&bull; Orientation: ________", sub_bullet_style))
    story.append(Paragraph("&bull; Memory: ________", sub_bullet_style))
    story.append(Paragraph("&bull; Attention: ________", sub_bullet_style))
    story.append(Paragraph("&bull; Language: ________", sub_bullet_style))
    story.append(Spacer(1, 8))

    # 6. Lab & Imaging Reports
    story.append(Paragraph("Lab & Imaging Reports:", section_style))
    story.append(Paragraph("- MRI Brain: Hippocampal atrophy / cortical sulci widening", bullet_style))
    story.append(Paragraph("- Blood Tests: Thyroid profile, Vitamin B12, Blood sugar &ndash; Normal / Abnormal", bullet_style))
    story.append(Paragraph("- EEG: Normal / Mild slowing of wave activity", bullet_style))
    story.append(Spacer(1, 8))

    # 7. Diagnosis
    story.append(Paragraph("Diagnosis:", section_style))
    story.append(Paragraph("Alzheimer's Disease (Early / Moderate / Advanced stage).", body_style))
    story.append(Spacer(1, 8))

    # 8. Treatment Plan
    story.append(Paragraph("Treatment Plan:", section_style))
    story.append(Paragraph("1. <b>Medications:</b> Donepezil / Rivastigmine / Memantine (as per condition).", bullet_style))
    story.append(Paragraph("2. <b>Lifestyle & Family Support:</b> Regular cognitive exercises, balanced diet, light physical exercise, family support.", bullet_style))
    story.append(Paragraph("3. <b>Follow-up:</b> Every 3&ndash;6 months with neurologist for monitoring.", bullet_style))
    story.append(Spacer(1, 8))

    # 9. Conclusion
    story.append(Paragraph("Conclusion:", section_style))
    story.append(Paragraph("Patient has been diagnosed with Alzheimer's Disease. It is a progressive condition, but with proper treatment and care, progression can be slowed, and quality of life can be improved.", body_style))
    story.append(Spacer(1, 22))

    # 10. Doctor's Signature
    sig_block = [
        Paragraph("___________________________", body_style),
        Paragraph("Doctor's Signature", body_style),
        Paragraph("Date: ___ / ___ / 20___", body_style)
    ]
    story.append(KeepTogether(sig_block))

    doc.build(story)
    print(f"Generated: {filename}")


if __name__ == "__main__":
    os.makedirs("sample_reports", exist_ok=True)
    os.makedirs("public/sample_reports", exist_ok=True)
    
    # Generate filled sample
    generate_filled_pdf("sample_reports/Vasundhara_Hospital_Alzheimer_Report_Sample.pdf")
    generate_filled_pdf("public/sample_reports/Vasundhara_Hospital_Alzheimer_Report_Sample.pdf")
    generate_filled_pdf("Vasundhara_Hospital_Alzheimer_Report_Sample.pdf")

    # Generate blank template
    generate_template_pdf("sample_reports/Vasundhara_Hospital_Alzheimer_Report_Template.pdf")
    generate_template_pdf("public/sample_reports/Vasundhara_Hospital_Alzheimer_Report_Template.pdf")
    generate_template_pdf("Vasundhara_Hospital_Alzheimer_Report_Template.pdf")
