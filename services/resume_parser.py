import re
import pdfplumber
from docx import Document

# =========================
# SKILLS DATABASE
# =========================

SKILLS_DB = [
    "python",
    "java",
    "sql",
    "react",
    "node",
    "aws",
    "html",
    "css",
    "javascript",
    "fastapi",
    "django",
    "mongodb",
    "excel",
    "power bi"
]

# =========================
# SKILLS EXTRACTION
# =========================

def extract_skills(text):

    found = []

    text_lower = text.lower()

    for skill in SKILLS_DB:
        if skill in text_lower:
            found.append(skill)

    return ", ".join(found)

# =========================
# COLLEGE EXTRACTION
# =========================

def extract_college(text):

    keywords = [
        "college",
        "university",
        "institute",
        "engineering"
    ]

    for line in text.split("\n"):

        lower = line.lower()

        for word in keywords:
            if word in lower:
                return line.strip()

    return None

# =========================
# PASSOUT YEAR
# =========================

def extract_passout_year(text):

    years = re.findall(r"\b(20\d{2}|19\d{2})\b", text)

    if years:
        return years[-1]

    return None

# =========================
# MAIN PARSER
# =========================

def extract_resume_data(file_path):

    text = ""

    try:

        # PDF
        if file_path.lower().endswith(".pdf"):

            with pdfplumber.open(file_path) as pdf:

                for page in pdf.pages:

                    text += page.extract_text() or ""
                    text += "\n"

        # DOCX
        elif file_path.lower().endswith(".docx"):

            doc = Document(file_path)

            text = "\n".join(
                p.text for p in doc.paragraphs
            )

        # EMAIL
        email_match = re.search(
            r'[\w\.-]+@[\w\.-]+\.\w+',
            text
        )

        email = (
            email_match.group()
            if email_match else None
        )

        # PHONE
        phone_match = re.search(
            r'(\+91)?[6-9]\d{9}',
            text
        )

        phone = (
            phone_match.group()
            if phone_match else None
        )

        # NAME
        lines = [
            line.strip()
            for line in text.split("\n")
            if line.strip()
        ]

        name = (
            lines[0][:100]
            if lines else "Unknown"
        )

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "skills": extract_skills(text),
            "college_name": extract_college(text),
            "passout_year": extract_passout_year(text)
        }

    except Exception as e:

        print("RESUME PARSER ERROR:", e)

        return {
            "name": "Unknown",
            "email": None,
            "phone": None,
            "skills": None,
            "college_name": None,
            "passout_year": None
        }

# =========================
# ATS SCORE
# =========================

def calculate_ats_score(resume_text, jd_text):

    score = 0

    resume_text = (resume_text or "").lower()
    jd_text = (jd_text or "").lower()

    jd_words = set(jd_text.split())
    resume_words = set(resume_text.split())

    matched = jd_words.intersection(resume_words)

    if jd_words:
        score += int(
            (len(matched) / len(jd_words)) * 60
        )

    if "experience" in resume_text:
        score += 20

    if (
        "degree" in resume_text
        or "bachelor" in resume_text
        or "college" in resume_text
    ):
        score += 10

    score += 10

    return min(score, 100)