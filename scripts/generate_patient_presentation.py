import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def create_presentation(pptx_path):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    PRIMARY = RGBColor(30, 41, 59)          # Slate 800
    ACCENT = RGBColor(99, 102, 241)         # Indigo
    WHITE = RGBColor(255, 255, 255)
    CARD_BG = RGBColor(248, 250, 252)       # Slate 50
    BORDER_COLOR = RGBColor(226, 232, 240)  # Slate 200
    TEXT_DARK = RGBColor(15, 23, 42)        # Slate 900
    TEXT_MUTED = RGBColor(100, 116, 139)    # Slate 500
    SUCCESS_COLOR = RGBColor(16, 185, 129)  # Emerald
    WARNING_COLOR = RGBColor(245, 158, 11)  # Amber

    def add_header(slide, title_text, category_text="CLINICAL CASE PRESENTATION"):
        banner = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.12))
        banner.fill.solid()
        banner.fill.fore_color.rgb = ACCENT
        banner.line.fill.background()

        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8), Inches(0.4))
        tf = cat_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"VASUNDHARA HOSPITAL, GHAZIABAD  •  {category_text.upper()}"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = ACCENT

        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.5), Inches(0.7))
        tf2 = title_box.text_frame
        tf2.word_wrap = True
        p2 = tf2.paragraphs[0]
        p2.text = title_text
        p2.font.size = Pt(22)
        p2.font.bold = True
        p2.font.color.rgb = PRIMARY

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=BORDER_COLOR):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.5)
        return shape

    # SLIDE 1: Title Slide (Cover)
    slide1 = prs.slides.add_slide(blank_slide_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = PRIMARY
    bg1.line.fill.background()

    dec = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.2), Inches(11.733), Inches(5.1))
    dec.fill.solid()
    dec.fill.fore_color.rgb = RGBColor(40, 53, 75)
    dec.line.color.rgb = RGBColor(99, 102, 241)
    dec.line.width = Pt(2)

    tb = slide1.shapes.add_textbox(Inches(1.3), Inches(1.8), Inches(10.7), Inches(0.6))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = "🏥 VASUNDHARA HOSPITAL, GHAZIABAD"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = RGBColor(165, 180, 252)

    tb2 = slide1.shapes.add_textbox(Inches(1.3), Inches(2.4), Inches(10.7), Inches(1.8))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    p2.text = "Alzheimer's Disease Clinical Case Study"
    p2.font.size = Pt(32)
    p2.font.bold = True
    p2.font.color.rgb = WHITE

    p2_sub = tf2.add_paragraph()
    p2_sub.text = "Patient Assessment, Diagnostic Findings, and Care Management Plan"
    p2_sub.font.size = Pt(16)
    p2_sub.font.color.rgb = RGBColor(203, 213, 225)
    p2_sub.space_before = Pt(8)

    tb3 = slide1.shapes.add_textbox(Inches(1.3), Inches(4.5), Inches(10.7), Inches(1.3))
    tf3 = tb3.text_frame
    p3 = tf3.paragraphs[0]
    p3.text = "👤 Patient: Mrs. Sunita Sharma  (68 yrs / Female)   |   ID: VH-2026-8841"
    p3.font.size = Pt(14)
    p3.font.bold = True
    p3.font.color.rgb = WHITE

    p3_doc = tf3.add_paragraph()
    p3_doc.text = "👨‍⚕️ Attending Neurologist: Dr. A. K. Banerjee (MD, DM Neurology)   |   Date: 10 / 11 / 2026"
    p3_doc.font.size = Pt(13)
    p3_doc.font.color.rgb = RGBColor(148, 163, 184)
    p3_doc.space_before = Pt(6)

    # SLIDE 2: Patient Profile & History
    slide2 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide2, "Patient Profile & Chief Complaints", "PATIENT BACKGROUND")
    add_card(slide2, 0.8, 1.5, 4.2, 5.3)
    tb = slide2.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(3.8), Inches(4.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "📋 Patient Information"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY

    fields = [
        ("Full Name", "Mrs. Sunita Sharma"),
        ("Age / Gender", "68 Years / Female"),
        ("Hospital ID", "VH-2026-8841"),
        ("Consult Date", "10th November 2026"),
        ("Department", "Neurology & Memory Care"),
        ("Consultant", "Dr. A. K. Banerjee"),
        ("Primary Caregiver", "Daughter (Ananya Sharma)"),
        ("Living Situation", "Home with family support")
    ]
    for lbl, val in fields:
        p_f = tf.add_paragraph()
        p_f.text = f"{lbl}: "
        p_f.font.bold = True
        p_f.font.size = Pt(11)
        p_f.font.color.rgb = TEXT_MUTED
        p_f.space_before = Pt(8)
        run = p_f.add_run()
        run.text = val
        run.font.bold = False
        run.font.color.rgb = TEXT_DARK

    add_card(slide2, 5.3, 1.5, 7.2, 5.3)
    tb = slide2.shapes.add_textbox(Inches(5.6), Inches(1.7), Inches(6.6), Inches(4.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🔍 Presenting Symptoms & Onset Timeline"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY

    complaints = [
        ("10-Month Memory Decline", "Family noticed progressive forgetfulness of recent conversations, daily plans, and dates."),
        ("Spatial Disorientation", "Twice lost orientation when taking routine morning walks to the neighborhood temple."),
        ("Difficulty in Complex Household Tasks", "Struggles with recipe steps, managing spice containers, and remembering stove timers."),
        ("Repetitive Inquiries", "Frequently asks the same question multiple times within a 30-minute timeframe."),
        ("Emotional & Sleep Changes", "Mild evening anxiety and sleep fragmentation; expresses frustration over memory slips.")
    ]
    for title, desc in complaints:
        p_c = tf.add_paragraph()
        p_c.text = f"•  {title}"
        p_c.font.bold = True
        p_c.font.size = Pt(12)
        p_c.font.color.rgb = ACCENT
        p_c.space_before = Pt(8)
        p_d = tf.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_DARK

    # SLIDE 3: Cognitive Examination
    slide3 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide3, "Cognitive Examination (MMSE Test Breakdown)", "OBJECTIVE MEASURES")
    add_card(slide3, 0.8, 1.5, 4.0, 5.3)
    tb = slide3.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(3.6), Inches(4.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Overall Cognitive Score"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = TEXT_MUTED

    p_score = tf.add_paragraph()
    p_score.text = "21 / 30"
    p_score.font.size = Pt(40)
    p_score.font.bold = True
    p_score.font.color.rgb = WARNING_COLOR
    p_score.space_before = Pt(6)

    p_status = tf.add_paragraph()
    p_status.text = "Mild-to-Moderate Cognitive Impairment"
    p_status.font.size = Pt(12)
    p_status.font.bold = True
    p_status.font.color.rgb = PRIMARY
    p_status.space_before = Pt(4)

    p_desc = tf.add_paragraph()
    p_desc.text = "A score of 21/30 indicates noticeable memory and orientation lapses, but conversational speech and basic comprehension remain preserved."
    p_desc.font.size = Pt(11)
    p_desc.font.color.rgb = TEXT_DARK
    p_desc.space_before = Pt(12)

    p_vitals = tf.add_paragraph()
    p_vitals.text = "Physical Vitals:\n• Blood Pressure: 126/80 mmHg\n• Pulse Rate: 72 bpm (Regular)\n• Motor / Gait: Normal, independent"
    p_vitals.font.size = Pt(11)
    p_vitals.font.color.rgb = TEXT_MUTED
    p_vitals.space_before = Pt(14)

    add_card(slide3, 5.1, 1.5, 7.4, 5.3)
    tb = slide3.shapes.add_textbox(Inches(5.4), Inches(1.7), Inches(6.8), Inches(4.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Sub-Test Score Breakdown"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY

    subtests = [
        ("Orientation (Time & Place)", "6 / 10", "Knows home city & building, but confused about exact day of the week and month."),
        ("Memory & Delayed Recall", "2 / 6", "Registered 3 objects immediately; recalled only 1 object after a 5-minute delay."),
        ("Attention & Calculation", "4 / 5", "Completed serial 7 subtraction with 1 minor calculation error."),
        ("Language, Naming & Praxis", "9 / 9", "Correctly named watch/pen, repeated phrases, followed 3-stage command.")
    ]
    for title, score, desc in subtests:
        p_t = tf.add_paragraph()
        p_t.text = f"•  {title}: "
        p_t.font.bold = True
        p_t.font.size = Pt(12)
        p_t.font.color.rgb = PRIMARY
        p_t.space_before = Pt(8)
        r_sc = p_t.add_run()
        r_sc.text = f"[{score}]"
        r_sc.font.bold = True
        r_sc.font.color.rgb = ACCENT
        p_d = tf.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_MUTED

    # SLIDE 4: Imaging & Diagnostics
    slide4 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide4, "Imaging & Laboratory Diagnostic Findings", "DIAGNOSTIC WORKUP")
    add_card(slide4, 0.8, 1.5, 5.6, 5.3)
    tb = slide4.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(5.2), Inches(4.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🧠 Brain MRI Findings"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY

    mri_points = [
        ("Medial Temporal Lobe", "Bilateral hippocampal volume loss observed (Scheltens MTA Grade 2)."),
        ("Cortical Structure", "Mild widening of cortical sulci in bilateral temporal and parietal regions."),
        ("Vascular Assessment", "Fazekas Grade 1 - minimal age-appropriate white matter changes; no acute stroke/infarct."),
        ("Clinical Implication", "Pattern is consistent with early-stage neurodegenerative Alzheimer's pathology.")
    ]
    for lbl, desc in mri_points:
        p_m = tf.add_paragraph()
        p_m.text = f"•  {lbl}:"
        p_m.font.bold = True
        p_m.font.size = Pt(12)
        p_m.font.color.rgb = ACCENT
        p_m.space_before = Pt(8)
        p_d = tf.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_DARK

    add_card(slide4, 6.7, 1.5, 5.8, 5.3)
    tb = slide4.shapes.add_textbox(Inches(6.9), Inches(1.7), Inches(5.4), Inches(4.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🧪 Laboratory & Functional Tests"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY

    lab_points = [
        ("Thyroid Panel (TSH / Free T4)", "Normal (2.1 uIU/mL) - Rule out thyroid dysfunction."),
        ("Serum Vitamin B12", "Normal (480 pg/mL) - Rule out metabolic memory loss."),
        ("Fasting Blood Sugar & HbA1c", "HbA1c 5.6% - Non-diabetic."),
        ("Electroencephalogram (EEG)", "Mild slowing of alpha background rhythm in temporal leads; no epileptiform activity."),
        ("Differential Exclusion", "Reversible causes of dementia ruled out by laboratory screening.")
    ]
    for lbl, desc in lab_points:
        p_l = tf.add_paragraph()
        p_l.text = f"•  {lbl}:"
        p_l.font.bold = True
        p_l.font.size = Pt(12)
        p_l.font.color.rgb = SUCCESS_COLOR
        p_l.space_before = Pt(8)
        p_d = tf.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_DARK

    # SLIDE 5: Diagnosis & Staging
    slide5 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide5, "Diagnosis & Stage Assessment", "CLINICAL IMPRESSION")
    diag_box = add_card(slide5, 0.8, 1.5, 11.733, 1.4, bg_color=RGBColor(238, 242, 255), border_color=ACCENT)
    tb = slide5.shapes.add_textbox(Inches(1.1), Inches(1.6), Inches(11.1), Inches(1.2))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Official Diagnosis: Alzheimer's Disease (Early-to-Moderate Stage)"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = ACCENT

    p_sub = tf.add_paragraph()
    p_sub.text = "ICD-10 / DSM-5 Criteria met: insidious onset with progressive memory deficit, confirmed by hippocampal volume reduction and MMSE 21/30."
    p_sub.font.size = Pt(12)
    p_sub.font.color.rgb = PRIMARY
    p_sub.space_before = Pt(4)

    pillars = [
        ("Current Condition", "Mild-to-Moderate Memory Decline", "The patient retains good physical independence and conversational ability, but requires supervision for safety, appointments, and medication schedules.", WARNING_COLOR),
        ("Disease Progression Rate", "Moderate Velocity (Expected -2.5 pts/yr)", "With timely initiation of anticholinesterase therapy and cognitive support, cognitive decline velocity can be significantly slowed.", SUCCESS_COLOR),
        ("Safety & Care Risk", "Low-to-Medium Vulnerability", "Main risks are getting lost outdoors and missing medication doses. Safe home environment and structured routine are key.", ACCENT)
    ]
    left_positions = [0.8, 4.8, 8.8]
    for i, (p_title, p_subhead, p_body, p_clr) in enumerate(pillars):
        add_card(slide5, left_positions[i], 3.2, 3.733, 3.6)
        tb = slide5.shapes.add_textbox(Inches(left_positions[i] + 0.2), Inches(3.4), Inches(3.333), Inches(3.2))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = p_title
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = TEXT_MUTED
        p2 = tf.add_paragraph()
        p2.text = p_subhead
        p2.font.size = Pt(14)
        p2.font.bold = True
        p2.font.color.rgb = p_clr
        p2.space_before = Pt(4)
        p3 = tf.add_paragraph()
        p3.text = p_body
        p3.font.size = Pt(11)
        p3.font.color.rgb = TEXT_DARK
        p3.space_before = Pt(8)

    # SLIDE 6: Care Plan
    slide6 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide6, "Comprehensive Treatment & Care Plan", "MANAGEMENT STRATEGY")

    meds = [
        ("Donepezil (Aricept) 5mg", "Take 1 tablet daily at bedtime. Titrate to 10mg after 4 weeks if well-tolerated."),
        ("Multivitamin & Antioxidants", "Vitamin D3 60k IU monthly + Omega-3 supplement."),
        ("Medication Dispenser", "Use labelled morning/night pill organizer managed by family.")
    ]
    add_card(slide6, 0.8, 1.5, 3.7, 5.3)
    tb = slide6.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(3.3), Inches(4.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "💊 Medications"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    for lbl, desc in meds:
        p_m = tf.add_paragraph()
        p_m.text = f"•  {lbl}"
        p_m.font.bold = True
        p_m.font.size = Pt(12)
        p_m.font.color.rgb = ACCENT
        p_m.space_before = Pt(8)
        p_d = tf.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_DARK

    cog = [
        ("Daily Orientation Board", "Large white board with date, day, weather, and 3 daily activities."),
        ("Memory Stimulations", "Looking at labeled family photo albums, simple crosswords, listening to music."),
        ("Physical Exercise", "30 minutes gentle morning walk with family member in familiar park.")
    ]
    add_card(slide6, 4.8, 1.5, 3.7, 5.3)
    tb = slide6.shapes.add_textbox(Inches(5.0), Inches(1.7), Inches(3.3), Inches(4.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🧩 Brain Exercises & Routine"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    for lbl, desc in cog:
        p_c = tf.add_paragraph()
        p_c.text = f"•  {lbl}"
        p_c.font.bold = True
        p_c.font.size = Pt(12)
        p_c.font.color.rgb = SUCCESS_COLOR
        p_c.space_before = Pt(8)
        p_d = tf.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_DARK

    safety = [
        ("Outdoor Safety", "Provide an emergency contact ID card or wearable GPS pendant."),
        ("Kitchen & Gas Safety", "Install safety knobs or auto-shutoff valves on gas stoves."),
        ("Emotional Validation", "Avoid arguing during memory lapses; offer gentle reassurance.")
    ]
    add_card(slide6, 8.8, 1.5, 3.7, 5.3)
    tb = slide6.shapes.add_textbox(Inches(9.0), Inches(1.7), Inches(3.3), Inches(4.9))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🛡️ Family & Safety Directives"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    for lbl, desc in safety:
        p_s = tf.add_paragraph()
        p_s.text = f"•  {lbl}"
        p_s.font.bold = True
        p_s.font.size = Pt(12)
        p_s.font.color.rgb = WARNING_COLOR
        p_s.space_before = Pt(8)
        p_d = tf.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_DARK

    # SLIDE 7: Monitoring Schedule
    slide7 = prs.slides.add_slide(blank_slide_layout)
    add_header(slide7, "Monitoring Schedule & Follow-Up Milestones", "LONGITUDINAL MONITORING")
    stages = [
        ("1 Month Check", "10th December 2026", "Medication Tolerance Review", "• Check Donepezil 5mg tolerance (nausea, sleep)\n• Step up dosage to 10mg if well tolerated\n• Review daily orientation board adoption"),
        ("3 Month Follow-Up", "10th February 2027", "Cognitive Staging & MMSE", "• Formal Repeat MMSE screening\n• Evaluate spatial navigation stability\n• Adjust caregiver assistance level"),
        ("6 Month Re-assessment", "10th May 2027", "Full Neuro-Psych Evaluation", "• Compare longitudinal MMSE rate of change\n• Repeat volumetric brain MRI if needed\n• Long-term family support planning")
    ]
    col_widths = 3.733
    for i, (interval, date_str, milestone, details) in enumerate(stages):
        add_card(slide7, left_positions[i], 1.5, col_widths, 4.4)
        tb = slide7.shapes.add_textbox(Inches(left_positions[i] + 0.2), Inches(1.7), Inches(col_widths - 0.4), Inches(4.0))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = interval
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = PRIMARY
        p_dt = tf.add_paragraph()
        p_dt.text = date_str
        p_dt.font.size = Pt(12)
        p_dt.font.bold = True
        p_dt.font.color.rgb = ACCENT
        p_dt.space_before = Pt(4)
        p_ms = tf.add_paragraph()
        p_ms.text = milestone
        p_ms.font.size = Pt(13)
        p_ms.font.bold = True
        p_ms.font.color.rgb = TEXT_DARK
        p_ms.space_before = Pt(8)
        p_det = tf.add_paragraph()
        p_det.text = details
        p_det.font.size = Pt(11)
        p_det.font.color.rgb = TEXT_MUTED
        p_det.space_before = Pt(8)

    add_card(slide7, 0.8, 6.1, 11.733, 0.9, bg_color=PRIMARY, border_color=PRIMARY)
    tb_sig = slide7.shapes.add_textbox(Inches(1.0), Inches(6.2), Inches(11.3), Inches(0.7))
    tf_sig = tb_sig.text_frame
    p_sig = tf_sig.paragraphs[0]
    p_sig.text = "👨‍⚕️ Attending Physician: Dr. A. K. Banerjee (MD, DM Neuro)   •   Vasundhara Hospital, Ghaziabad   •   Emergency Support: +91-120-4567890"
    p_sig.font.size = Pt(12)
    p_sig.font.bold = True
    p_sig.font.color.rgb = WHITE

    prs.save(pptx_path)
    print(f"[OK] Presentation created successfully at: {pptx_path}")

def generate_patient_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=45,
        bottomMargin=45
    )
    styles = getSampleStyleSheet()
    h1_style = ParagraphStyle('HospitalHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=18, leading=22, alignment=1, textColor=colors.black, spaceAfter=4)
    sub_header_style = ParagraphStyle('ReportHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=15, leading=19, alignment=1, textColor=colors.black, spaceAfter=18)
    section_style = ParagraphStyle('SectionHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12.5, leading=16, textColor=colors.black, spaceBefore=10, spaceAfter=5)
    body_style = ParagraphStyle('BodyTextCustom', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=14.5, textColor=colors.black)
    bullet_style = ParagraphStyle('BulletCustom', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=14, leftIndent=15, firstLineIndent=-10, textColor=colors.black)
    sub_bullet_style = ParagraphStyle('SubBulletCustom', parent=styles['Normal'], fontName='Helvetica', fontSize=9.5, leading=13.5, leftIndent=28, textColor=colors.HexColor('#222222'))

    story = []
    story.append(Paragraph("Vasundhara Hospital, Ghaziabad", h1_style))
    story.append(Paragraph("Alzheimer's Disease Medical Report", sub_header_style))

    story.append(Paragraph("Patient Details:", section_style))
    table_data = [
        [Paragraph("<b>Name:</b>", body_style), Paragraph("Mrs. Sunita Sharma", body_style)],
        [Paragraph("<b>Age/Gender:</b>", body_style), Paragraph("68 years / Female", body_style)],
        [Paragraph("<b>Report Date:</b>", body_style), Paragraph("10 / 11 / 2026", body_style)]
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

    story.append(Paragraph("Medical History:", section_style))
    history_items = [
        "Memory decline observed over the past 10 months with progressive forgetfulness of names and dates.",
        "Disorientation during outdoor walks in neighborhood; difficulty remembering cooking sequences.",
        "Repeats questions periodically; expresses anxiety regarding memory slips.",
        "Sleep disturbances and mild evening agitation observed by family members."
    ]
    for h in history_items:
        story.append(Paragraph(f"• {h}", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Physical & Cognitive Examination:", section_style))
    exam_items = [
        "Blood Pressure: 126/80 mmHg",
        "Pulse: 72 per minute (Regular rhythm)",
        "Cognitive Test (MMSE Score): <b>21 / 30</b> (Mild-to-Moderate Cognitive Impairment)"
    ]
    for e in exam_items:
        story.append(Paragraph(f"• {e}", bullet_style))
    
    sub_scores = [
        "Orientation: 6 / 10 (Confused about day of week & month)",
        "Memory: 2 / 6 (Delayed recall 1/3 objects)",
        "Attention: 4 / 5 (Serial 7 subtraction with minor slip)",
        "Language: 9 / 9 (Naming and repetition preserved)"
    ]
    for s in sub_scores:
        story.append(Paragraph(f"• {s}", sub_bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Lab & Imaging Reports:", section_style))
    lab_items = [
        "MRI Brain: Bilateral hippocampal volume loss (MTA Grade 2), mild temporal horn widening.",
        "Blood Tests: Thyroid profile (TSH 2.1 uIU/mL), Vitamin B12 (480 pg/mL), Fasting Blood Sugar - Normal.",
        "EEG: Mild slowing of background activity in temporal leads; no focal epileptic discharges."
    ]
    for l in lab_items:
        story.append(Paragraph(f"• {l}", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Diagnosis:", section_style))
    story.append(Paragraph("Alzheimer's Disease (Early-to-Moderate Stage).", body_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Treatment Plan:", section_style))
    treatment_items = [
        "Medications: Donepezil 5mg once daily at bedtime (titrate to 10mg after 4 weeks).",
        "Lifestyle & Family Support: Daily orientation whiteboard, memory games, supervised walks, balanced diet.",
        "Follow-up: Neurological evaluation every 3 months for cognitive score monitoring."
    ]
    for idx, t_text in enumerate(treatment_items, 1):
        story.append(Paragraph(f"{idx}. {t_text}", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Conclusion:", section_style))
    story.append(Paragraph(
        "Patient has been diagnosed with Early-to-Moderate Alzheimer's Disease. With structured cognitive exercises, "
        "proper anticholinesterase therapy, and active family caregiving, disease progression velocity can be controlled, "
        "and quality of daily living significantly supported.",
        body_style
    ))
    story.append(Spacer(1, 24))

    sig_block = [
        Paragraph("___________________________", body_style),
        Paragraph("<b>Doctor's Signature:</b> Dr. A. K. Banerjee (MD, DM Neuro)", body_style),
        Paragraph("<b>Date:</b> 10 / 11 / 2026", body_style)
    ]
    story.append(KeepTogether(sig_block))

    doc.build(story)
    print(f"[OK] PDF Report created successfully at: {filename}")

if __name__ == '__main__':
    downloads_dir = 'C:\\Users\\DELL\\Downloads'
    workspace_dir = 'c:\\Users\\DELL\\OneDrive\\Desktop\\VMedithon-Radix'
    sample_reports_dir = os.path.join(workspace_dir, 'sample_reports')
    public_reports_dir = os.path.join(workspace_dir, 'public', 'sample_reports')
    
    os.makedirs(sample_reports_dir, exist_ok=True)
    os.makedirs(public_reports_dir, exist_ok=True)

    pptx_name = 'Vasundhara_Hospital_Alzheimer_Case_Presentation_Sunita_Sharma.pptx'
    pdf_name = 'Vasundhara_Hospital_Alzheimer_Report_Sunita_Sharma.pdf'

    dl_pptx = os.path.join(downloads_dir, pptx_name)
    dl_pdf = os.path.join(downloads_dir, pdf_name)
    create_presentation(dl_pptx)
    generate_patient_pdf(dl_pdf)

    for d in [workspace_dir, sample_reports_dir, public_reports_dir]:
        create_presentation(os.path.join(d, pptx_name))
        generate_patient_pdf(os.path.join(d, pdf_name))
