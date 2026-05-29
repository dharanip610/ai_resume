import re

# =========================
# SKILL PRIORITY
# =========================

HIGH = [
    "python",
    "react",
    "fastapi",
    "sql"
]

MEDIUM = [
    "docker",
    "aws",
    "git"
]

LOW = [
    "html",
    "css",
    "javascript"
]

MASTER = HIGH + MEDIUM + LOW


# =========================
# SAFE JD SKILL EXTRACTION
# =========================

def extract_skills(text):

    if not text:
        return []

    text = str(text).lower()

    found = []

    for skill in MASTER:

        pattern = r'\b' + re.escape(skill) + r'\b'

        if re.search(pattern, text):

            found.append(skill)

    return found


# =========================
# SAFE RESUME SKILLS PARSER
# =========================

def parse_skills(skills):

    if not skills:
        return []

    # already list
    if isinstance(skills, list):

        return [
            str(s).lower().strip()
            for s in skills
        ]

    # comma string
    return [
        s.strip().lower()
        for s in str(skills).split(",")
        if s.strip()
    ]


# =========================
# ATS CALCULATION
# =========================

def calculate(jd, resume):

    jd_set = set(jd)
    res_set = set(resume)

    matched = list(jd_set & res_set)
    missing = list(jd_set - res_set)

    score = 0

    for skill in matched:

        if skill in HIGH:
            score += 10

        elif skill in MEDIUM:
            score += 6

        elif skill in LOW:
            score += 3

    max_score = len(jd_set) * 10 if jd_set else 1

    ats = int((score / max_score) * 100)

    return ats, matched, missing


# =========================
# MAIN FUNCTION
# =========================

def analyze_candidates(resumes, jd_text):

    jd_skills = extract_skills(jd_text)

    results = []

    for r in resumes:

        resume_skills = parse_skills(
            r.get("skills")
        )

        ats, matched, missing = calculate(
            jd_skills,
            resume_skills
        )

        results.append({

            "name": r.get("name", ""),
            "email": r.get("email", ""),
            "phone": r.get("phone", ""),
            "address": r.get("address", ""),
            "filename": r.get("filename", ""),

            "ats_score": ats,

            "matched_skills": matched,
            "missing_skills": missing
        })

    # TOP ATS
    results.sort(
        key=lambda x: x["ats_score"],
        reverse=True
    )

    return {
        "jd_skills": jd_skills,
        "top_candidates": results[:5]
    }