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

    blacklist = [
        "resume",
        "curriculum vitae",
        "software engineer",
        "software developer",
        "developer",
        "engineer",
        "profile",
        "summary",
        "education",
        "skills",
        "experience",
        "projects",
        "internship",
        "contact",
        "objective"
    ]

    for line in lines[:20]:

        line = line.strip()

        if not line:
            continue

        if "@" in line:
            continue

        if any(char.isdigit() for char in line):
            continue

        if len(line.split()) > 4:
            continue

        if line.lower() in blacklist:
            continue

        if len(line) < 3:
            continue

        return line.title()

    return "Unknown"


# =========================
# EXTRACT EMAIL
# =========================

def extract_email(text):

    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'

    emails = re.findall(email_pattern, text)

    if emails:
        return emails[0]

    return ""


# =========================
# EXTRACT PHONE
# =========================

def extract_phone(text):

    phone_pattern = r'(?:\+91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}'

    match = re.search(phone_pattern, text)

    if match:

        phone = match.group(0)

        # remove spaces and symbols
        phone = re.sub(r"\D", "", phone)

        return phone

    return ""


# =========================
# EXTRACT SKILLS
# =========================

def extract_skills(text):

    skills_list = [

        # Programming
        "python",
        "java",
        "c",
        "c++",
        "c#",

        # Web
        "html",
        "css",
        "javascript",
        "typescript",
        "react",
        "angular",
        "vue",
        "nodejs",
        "express",

        # Python Frameworks
        "django",
        "flask",
        "fastapi",

        # Database
        "sql",
        "mysql",
        "postgresql",
        "mongodb",

        # Cloud
        "aws",
        "azure",
        "gcp",

        # DevOps
        "docker",
        "kubernetes",
        "git",
        "github",

        # AI / ML
        "machine learning",
        "deep learning",
        "artificial intelligence",
        "tensorflow",
        "pytorch",
        "nlp",
        "computer vision",

        # Analytics
        "power bi",
        "tableau",
        "excel",
        "data science"
    ]

    found_skills = []

    lower_text = text.lower()

    for skill in skills_list:

        pattern = r'\b' + re.escape(skill.lower()) + r'\b'

        if re.search(pattern, lower_text):

            found_skills.append(skill)

    return sorted(list(set(found_skills)))


# =========================
# MAIN FUNCTION
# =========================

def extract_resume_data(file_path):

    text = extract_text(file_path)

    name = extract_name(text)

    email = extract_email(text)

    phone = extract_phone(text)

    skills = extract_skills(text)

    return {

        "name": name,

        "email": email,

        "phone": phone,

        "skills": ", ".join(skills),

        "raw_text": text
    }