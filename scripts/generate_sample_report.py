import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_filled_pdf(filename, is_worsening=False):
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
    story.append(Paragraph("Alzheimer's Disease Medical Report", sub_header_style))

    # 2. Patient Details Table
    story.append(Paragraph("Patient Details:", section_style))
    
    report_date = "18 / 03 / 2027" if is_worsening else "14 / 09 / 2026"
    age_str = "73 years / Male" if is_worsening else "72 years / Male"

    table_data = [
        [Paragraph("<b>Name:</b>", body_style), Paragraph("Rajesh K. Verma", body_style)],
        [Paragraph("<b>Age/Gender:</b>", body_style), Paragraph(age_str, body_style)],
        [Paragraph("<b>Report Date:</b>", body_style), Paragraph(report_date, body_style)]
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
    if is_worsening:
        story.append(Paragraph("- Memory decline since 20 months (marked rapid clinical deterioration over the last 6 months).", bullet_style))
        story.append(Paragraph("- Frequently forgets close family members' names, confuses grandchildren, and got lost in home backyard.", bullet_style))
        story.append(Paragraph("- Pronounced behavioral changes, severe apathy, wandering attempts toward outside street, and difficulty dressing.", bullet_style))
        story.append(Paragraph("- Significant evening agitation (sundowning) and severe sleep cycle inversion.", bullet_style))
    else:
        story.append(Paragraph("- Memory decline since 14 months (worsening episodic memory loss reported by spouse).", bullet_style))
        story.append(Paragraph("- Frequently forgets objects, names, dates, or directions in familiar neighborhood.", bullet_style))
        story.append(Paragraph("- Behavioral changes and difficulty in decision making / managing household finances.", bullet_style))
        story.append(Paragraph("- Sleep disturbances and mood changes observed (evening anxiety, restless sleep).", bullet_style))
    story.append(Spacer(1, 8))

    # 5. Physical & Cognitive Examination
    story.append(Paragraph("Physical & Cognitive Examination:", section_style))
    if is_worsening:
        story.append(Paragraph("- Blood Pressure: 138/86 mmHg", bullet_style))
        story.append(Paragraph("- Pulse: 78 per minute", bullet_style))
        story.append(Paragraph("- Cognitive Test (MMSE Score): <b>13 / 30</b> (Significant decline from previous score of 19/30 on 14/09/2026; lost 6 points in 6 months)", bullet_style))
        story.append(Paragraph("&bull; Orientation: 2 / 10 (disoriented to date, year, and hospital location)", sub_bullet_style))
        story.append(Paragraph("&bull; Memory: 0 / 6 (0/3 word recall at 3 minutes; profound delayed recall deficit)", sub_bullet_style))
        story.append(Paragraph("&bull; Attention: 2 / 5 (unable to complete serial subtractions)", sub_bullet_style))
        story.append(Paragraph("&bull; Language: 6 / 9 (significant word-finding pauses, simplified speech, naming difficulty)", sub_bullet_style))
    else:
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
    if is_worsening:
        story.append(Paragraph("- <b>MRI Brain:</b> Severe bilateral hippocampal atrophy (MTA Score: Grade 3/4 progression), significant ventricular enlargement, widening of Sylvian fissures and diffuse cortical volume reduction.", bullet_style))
        story.append(Paragraph("- <b>Blood Tests:</b> Thyroid profile (TSH: 2.3 mIU/L - Normal), Vitamin B12 (390 pg/mL - Normal), Blood sugar (HbA1c: 5.9% - Normal)", bullet_style))
        story.append(Paragraph("- <b>EEG:</b> Moderate generalized slowing with theta/delta wave predominance across bilateral temporal and parietal regions.", bullet_style))
    else:
        story.append(Paragraph("- <b>MRI Brain:</b> Hippocampal atrophy / cortical sulci widening (MTA Score: Grade 2 bilateral hippocampal volume reduction)", bullet_style))
        story.append(Paragraph("- <b>Blood Tests:</b> Thyroid profile (TSH: 2.1 mIU/L - Normal), Vitamin B12 (420 pg/mL - Normal), Blood sugar (HbA1c: 5.7% - Normal)", bullet_style))
        story.append(Paragraph("- <b>EEG:</b> Mild slowing of theta wave activity in bilateral fronto-temporal regions; no epileptiform discharges", bullet_style))
    story.append(Spacer(1, 8))

    # 7. Diagnosis
    story.append(Paragraph("Diagnosis:", section_style))
    if is_worsening:
        story.append(Paragraph("<b>Alzheimer's Disease (Moderate-to-Advanced / Severe stage)</b> &mdash; Accelerated neurodegenerative decline with severe episodic memory impairment and functional dependency.", body_style))
    else:
        story.append(Paragraph("<b>Alzheimer's Disease (Moderate stage)</b> &mdash; Progressive neurodegenerative course with longitudinal cognitive decline.", body_style))
    story.append(Spacer(1, 8))

    # 8. Treatment Plan
    story.append(Paragraph("Treatment Plan:", section_style))
    if is_worsening:
        story.append(Paragraph("1. <b>Medications:</b> Donepezil 10mg OD continued; Memantine titrated up to 20mg daily (10mg BD). Consider low-dose Quetiapine 12.5mg for evening agitation/sundowning if distress persists.", bullet_style))
        story.append(Paragraph("2. <b>Lifestyle & Family Support:</b> Full-time 24/7 caregiver assistance for eating, bathing, and dressing. Install door exit chime alarms and GPS wearable locator to prevent wandering accidents.", bullet_style))
        story.append(Paragraph("3. <b>Follow-up:</b> Close neurological monitoring every 2&ndash;3 months for behavioral and functional status check.", bullet_style))
    else:
        story.append(Paragraph("1. <b>Medications:</b> Donepezil 10mg once daily (OD) post dinner; Memantine 10mg twice daily (BD) with titration.", bullet_style))
        story.append(Paragraph("2. <b>Lifestyle & Family Support:</b> Regular cognitive exercises, structured visual routines, balanced Mediterranean diet, light daily physical exercise, active family supervision.", bullet_style))
        story.append(Paragraph("3. <b>Follow-up:</b> Every 3&ndash;6 months with neurologist for monitoring of cognitive trajectory and treatment response.", bullet_style))
    story.append(Spacer(1, 8))

    # 9. Conclusion
    story.append(Paragraph("Conclusion:", section_style))
    if is_worsening:
        story.append(Paragraph("Patient exhibits advanced cognitive and functional progression of Alzheimer's Disease. Patient is no longer safe to remain unsupervised at home. Intensive caregiver support, home safety modifications, and memory-assistive protocols are urgently required.", body_style))
    else:
        story.append(Paragraph("Patient has been diagnosed with Alzheimer's Disease. It is a progressive condition, but with proper treatment, cognitive rehabilitation, and compassionate care, progression can be slowed, and quality of life can be improved.", body_style))
    story.append(Spacer(1, 20))

    # 10. Doctor's Signature
    sig_block = [
        Paragraph("___________________________", body_style),
        Paragraph("<b>Dr. A. K. Banerjee</b> (MD, DM Neuro)", body_style),
        Paragraph("Consultant Neurologist, Reg. No: MCI-48291", body_style),
        Paragraph("Doctor's Signature", body_style),
        Paragraph(f"Date: {report_date}", body_style)
    ]
    story.append(KeepTogether(sig_block))

    doc.build(story)
    print(f"Generated: {filename}")


if __name__ == "__main__":
    os.makedirs("sample_reports", exist_ok=True)
    os.makedirs("public/sample_reports", exist_ok=True)
    
    # 1. Baseline / Moderate Stage Report (14/09/2026)
    generate_filled_pdf("sample_reports/Vasundhara_Hospital_Alzheimer_Report_Sample.pdf", is_worsening=False)
    generate_filled_pdf("public/sample_reports/Vasundhara_Hospital_Alzheimer_Report_Sample.pdf", is_worsening=False)
    generate_filled_pdf("Vasundhara_Hospital_Alzheimer_Report_Sample.pdf", is_worsening=False)

    # 2. Worsening / Advanced Stage Follow-Up Report (18/03/2027)
    generate_filled_pdf("sample_reports/Vasundhara_Hospital_Alzheimer_Report_Worsening_Case.pdf", is_worsening=True)
    generate_filled_pdf("public/sample_reports/Vasundhara_Hospital_Alzheimer_Report_Worsening_Case.pdf", is_worsening=True)
    generate_filled_pdf("Vasundhara_Hospital_Alzheimer_Report_Worsening_Case.pdf", is_worsening=True)
