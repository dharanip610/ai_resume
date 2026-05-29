import re
from pathlib import Path
import pdfplumber
import docx


# =========================
# READ FILE TEXT
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

    return text


# =========================
# EXTRACT NAME
# =========================

def extract_name(text):

    lines = text.split("\n")

    for line in lines[:15]:

        line = line.strip()

        # avoid emails
        if "@" in line:
            continue

        # avoid numbers
        if any(char.isdigit() for char in line):
            continue

        # possible name
        words = line.split()

        if 1 < len(words) <= 4:
            return line.title()

    return "Unknown"


# =========================
# MAIN FUNCTION
# =========================

def extract_resume_data(file_path):

    text = extract_text(file_path)

    # =========================
    # EMAIL
    # =========================

    email_match = re.search(
        r'[\w\.-]+@[\w\.-]+\.\w+',
        text
    )

    email = email_match.group(0) if email_match else ""


    # =========================
    # PHONE
    # =========================

    phone_match = re.search(
        r'(\+91[\-\s]?)?[6-9]\d{9}',
        text
    )

    phone = phone_match.group(0) if phone_match else ""


    # =========================
    # SKILLS
    # =========================

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

    # remove duplicates
    found_skills = list(set(found_skills))


    return {

        "name": extract_name(text),

        "email": email,

        "phone": phone,

        "skills": ", ".join(found_skills),

        "raw_text": text
    }