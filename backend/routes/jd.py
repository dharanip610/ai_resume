from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.jd_analyzer import analyze_candidates
from app.db.supabase_client import load_data

router = APIRouter()

# =========================
# REQUEST MODEL
# =========================

class JDRequest(BaseModel):
    job_description: str


# =========================
# JD ANALYSIS ENDPOINT
# =========================

@router.post("/analyze-jd")
def analyze_jd(payload: JDRequest):

    try:
        # 1. FETCH ALL RESUMES FROM DB
        resumes = load_data()

        if not resumes:
            return {
                "message": "No resumes found",
                "data": []
            }

        # 2. RUN AI ENGINE
        result = analyze_candidates(resumes, payload.job_description)

        # 3. RETURN RESPONSE
        return {
            "status": "success",
            "data": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )