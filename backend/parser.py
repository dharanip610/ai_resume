import re
from pathlib import Path
import pdfplumber
import docx

# =========================
# EXTRACT TEXT
# =========================

def extract_text(file_path):

    ext = Path(file_path).suffix.lower()

    text = ""

    # PDF
    if ext == ".pdf":

        with pdfplumber.open(file_path) as pdf:

            for page in pdf.pages:
                page_text = page.extract_text()

                if page_text:
                    text += page_text + "\n"

    # DOCX
    elif ext == ".docx":

        doc = docx.Document(file_path)

        for para in doc.paragraphs:
            text += para.text + "\n"

    else:
        raise ValueError("Unsupported file format")

    return text


# =========================
# EXTRACT NAME
# =========================

def extract_name(text):

    lines = text.split("\n")

    for line in lines[:10]:

        line = line.strip()

        if len(line) > 2 and len(line.split()) <= 4:
            return line

    return "Unknown"


# =========================
# MAIN PARSER
# =========================

def extract_resume_data(file_path):

    text = extract_text(file_path)

    # EMAIL
    email = re.findall(r"[\w\.-]+@[\w\.-]+", text)

    # PHONE
    phone = re.findall(r"\+?\d[\d\s-]{8,15}", text)

    # SKILLS
    skills_list = [
        "python",
        "java",
        "react",
        "fastapi",
        "sql",
        "docker",
        "aws",
        "git",
        "html",
        "css",
        "javascript",
        "machine learning",
        "ai"
    ]

    found_skills = []

    lower_text = text.lower()

    for skill in skills_list:
        if skill in lower_text:
            found_skills.append(skill)

    return {

        "name": extract_name(text),

        "email": email[0] if email else "",

        "phone": phone[0] if phone else "",

        "skills": ", ".join(found_skills),

        "raw_text": text
    }