import re

def extract_resume_data(file_path):

    with open(file_path, "rb") as f:
        text = f.read().decode("utf-8", errors="ignore")

    email = re.findall(r"[\w\.-]+@[\w\.-]+", text)
    phone = re.findall(r"\d{10}", text)

    skills_list = [
        "python", "java", "react", "fastapi",
        "sql", "docker", "aws", "git"
    ]

    found = [s for s in skills_list if s in text.lower()]

    return {
        "name": "Unknown",
        "email": email[0] if email else "",
        "phone": phone[0] if phone else "",
        "skills": ",".join(found),
        "raw_text": text
    }