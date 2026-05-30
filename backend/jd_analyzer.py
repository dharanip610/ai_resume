import re

# =========================
# SKILL PRIORITY
# =========================

HIGH = ["python", "react", "fastapi", "sql"]
MEDIUM = ["docker", "aws", "git"]
LOW = ["html", "css", "javascript"]

MASTER = HIGH + MEDIUM + LOW

# =========================
# SYNONYMS FIX (IMPORTANT)
# =========================

ALIASES = {
    "fast api": "fastapi",
    "fast-api": "fastapi",
    "node js": "nodejs",
    "node.js": "nodejs",
    "react.js": "react",
    "machine learning": "ml"
}

# =========================
# NORMALIZE TEXT
# =========================

def normalize(text):

    if not text:
        return ""

    text = text.lower()

    for k, v in ALIASES.items():
        text = text.replace(k, v)

    return text

# =========================
# EXTRACT JD SKILLS
# =========================

def extract_skills(text):

    text = normalize(text)

    found = []

    for skill in MASTER:

        pattern = r'\b' + re.escape(skill) + r'\b'

        if re.search(pattern, text):
            found.append(skill)

    return list(set(found))

# =========================
# PARSE RESUME SKILLS
# =========================

def parse_skills(skills):

    if not skills:
        return []

    if isinstance(skills, list):
        return [str(s).lower().strip() for s in skills]

    return [
        s.strip().lower()
        for s in str(skills).split(",")
        if s.strip()
    ]

# =========================
# ATS CALCULATION (IMPROVED)
# =========================

def calculate(jd_skills, resume_skills):

    jd_set = set(jd_skills)
    res_set = set(resume_skills)

    matched = list(jd_set & res_set)
    missing = list(jd_set - res_set)

    if not jd_set:
        return 0, matched, missing

    # weighted scoring
    score = 0

    for skill in matched:
        if skill in HIGH:
            score += 10
        elif skill in MEDIUM:
            score += 6
        else:
            score += 3

    max_score = len(jd_set) * 10
    ats = int((score / max_score) * 100)

    return ats, matched, missing

# =========================
# MAIN FUNCTION
# =========================

def analyze_candidates(resumes, jd_text):

    jd_skills = extract_skills(jd_text)

    results = []

    for r in resumes:

        resume_skills = parse_skills(r.get("skills"))

        ats_score, matched, missing = calculate(
            jd_skills,
            resume_skills
        )

        results.append({
            "name": r.get("name", ""),
            "email": r.get("email", ""),
            "phone": r.get("phone", ""),
            "filename": r.get("filename", ""),
            "ats_score": ats_score,
            "resume_skills": resume_skills,
            "matched_skills": matched,
            "missing_skills": missing
        })

    # =========================
    # REMOVE DUPLICATES (EMAIL SAFE)
    # =========================

    best = {}

    for r in results:

        email = (r.get("email") or "").strip().lower()

        if not email:
            continue

        if email not in best:
            best[email] = r
        else:
            if r["ats_score"] > best[email]["ats_score"]:
                best[email] = r

    unique = list(best.values())

    # =========================
    # SHORTLIST FILTER
    # =========================

    qualified = [r for r in unique if r["ats_score"] >= 50]

    qualified.sort(key=lambda x: x["ats_score"], reverse=True)

    return {
        "jd_skills": jd_skills,
        "total_candidates": len(results),
        "unique_candidates": len(unique),
        "shortlisted_candidates": len(qualified),
        "top_candidates": qualified[:5]
    }