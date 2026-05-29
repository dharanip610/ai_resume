HIGH = ["python", "react", "fastapi", "sql"]
MEDIUM = ["docker", "aws", "git"]
LOW = ["html", "css", "javascript"]

MASTER = HIGH + MEDIUM + LOW


# =========================
# SAFE JD SKILL EXTRACTION
# =========================
def extract_skills(text):
    if not text:
        return []

    text = str(text).lower()
    return [s for s in MASTER if s in text]


# =========================
# SAFE RESUME SKILLS PARSER
# =========================
def parse_skills(skills):
    if not skills:
        return []

    if isinstance(skills, list):
        return [s.lower().strip() for s in skills]

    return [s.strip().lower() for s in str(skills).split(",") if s.strip()]


# =========================
# ATS CALCULATION
# =========================
def calculate(jd, resume):

    jd_set = set(jd)
    res_set = set(resume)

    matched = list(jd_set & res_set)
    missing = list(jd_set - res_set)

    score = 0

    for s in matched:
        if s in HIGH:
            score += 10
        elif s in MEDIUM:
            score += 6
        else:
            score += 3

    max_score = len(jd_set) * 10 if jd_set else 1
    ats = int((score / max_score) * 100)

    return ats, matched, missing


# =========================
# MAIN FUNCTION (FIXED)
# =========================
def analyze_candidates(resumes, jd_text):

    jd_skills = extract_skills(jd_text)

    results = []

    for r in resumes:

        resume_skills = parse_skills(r.get("skills"))

        ats, matched, missing = calculate(jd_skills, resume_skills)

        results.append({
            "name": r.get("name", ""),
            "email": r.get("email", ""),
            "phone": r.get("phone", ""),
            "filename": r.get("filename", ""),

            "ats_score": ats,
            "matched_skills": matched,
            "missing_skills": missing
        })

    # sort top candidates
    results.sort(key=lambda x: x["ats_score"], reverse=True)

    return {
        "jd_skills": jd_skills,
        "top_candidates": results[:5]   # 🔥 TOP 5 FIX
    }