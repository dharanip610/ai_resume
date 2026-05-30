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
# JD SKILL EXTRACTION
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

    return list(set(found))

# =========================
# RESUME SKILLS PARSER
# =========================

def parse_skills(skills):

    if not skills:
        return []

    if isinstance(skills, list):

        return [
            str(s).lower().strip()
            for s in skills
        ]

    return [
        s.strip().lower()
        for s in str(skills).split(",")
        if s.strip()
    ]

# =========================
# ATS CALCULATION
# =========================

def calculate(jd_skills, resume_skills):

    jd_set = set(jd_skills)
    resume_set = set(resume_skills)

    matched = list(jd_set & resume_set)
    missing = list(jd_set - resume_set)

    score = 0

    for skill in matched:

        if skill in HIGH:
            score += 10

        elif skill in MEDIUM:
            score += 6

        elif skill in LOW:
            score += 3

    max_score = len(jd_set) * 10 if jd_set else 1

    ats_score = int((score / max_score) * 100)

    return ats_score, matched, missing

# =========================
# MAIN ANALYZER
# =========================

def analyze_candidates(resumes, jd_text):

    jd_skills = extract_skills(jd_text)

    results = []

    for r in resumes:

        resume_skills = parse_skills(
            r.get("skills")
        )

        ats_score, matched, missing = calculate(
            jd_skills,
            resume_skills
        )

        candidate = {

            "name": r.get("name", ""),

            "email": r.get("email", ""),

            "phone": r.get("phone", ""),

            "filename": r.get("filename", ""),

            "ats_score": ats_score,

            "resume_skills": resume_skills,

            "matched_skills": matched,

            "missing_skills": missing
        }

        results.append(candidate)

    # Only shortlisted candidates
    qualified = [

        r for r in results

        if r["ats_score"] >= 50
    ]

    qualified.sort(
        key=lambda x: x["ats_score"],
        reverse=True
    )

    return {

        "jd_skills": jd_skills,

        "total_candidates": len(results),

        "shortlisted_candidates": len(qualified),

        "top_candidates": qualified[:5]
    }