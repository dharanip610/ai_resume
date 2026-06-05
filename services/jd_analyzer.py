import re
from collections import Counter


# =========================
# TEXT CLEANING
# =========================
def clean_text(text: str) -> str:
    if not text:
        return ""

    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text


# =========================
# KEYWORD EXTRACTION
# =========================
def extract_keywords(text: str):

    words = clean_text(text).split()

    return [
        word
        for word in words
        if len(word) > 2
    ]


# =========================
# ATS SCORE
# =========================
def calculate_score(
    resume_text: str,
    jd_text: str
):

    resume_words = extract_keywords(
        resume_text
    )

    jd_words = extract_keywords(
        jd_text
    )

    if not jd_words:

        return {
            "score": 0,
            "matched_keywords": [],
            "missing_keywords": []
        }

    resume_counter = Counter(
        resume_words
    )

    matched = []
    missing = []

    for word in set(jd_words):

        if resume_counter.get(word, 0) > 0:
            matched.append(word)
        else:
            missing.append(word)

    score = int(
        (
            len(matched)
            / len(set(jd_words))
        ) * 100
    )

    return {
        "score": min(score, 100),
        "matched_keywords": matched,
        "missing_keywords": missing
    }


# =========================
# ATS ENGINE
# =========================
def analyze_candidates(
    resumes: list,
    jd_text: str
):

    results = []

    for candidate in resumes:

        try:

            resume_text = " ".join(
                str(v)
                for v in candidate.values()
                if v
            )

            analysis = calculate_score(
                resume_text,
                jd_text
            )

            results.append({
                "id": candidate.get("id"),
                "name": candidate.get("name"),
                "email": candidate.get("email"),
                "phone": candidate.get("phone"),

                "score": analysis["score"],

                "matched_keywords":
                    analysis["matched_keywords"],

                "missing_keywords":
                    analysis["missing_keywords"]
            })

        except Exception as e:

            print(
                "ATS ERROR:",
                e
            )

    results = sorted(
        results,
        key=lambda x: x["score"],
        reverse=True
    )

    return {
        "total_candidates":
            len(results),

        "results":
            results
    }