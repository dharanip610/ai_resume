import PyPDF2
from docx import Document
import re
import sys
import os
from datetime import datetime
import io
import pandas as pd

from fastapi import FastAPI, UploadFile, File, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from supabase_auth.errors import AuthApiError
from fastapi.middleware.cors import CORSMiddleware
from services.resume_parser import extract_resume_data
from services.supabase_client import supabase
from services.jd_analyzer import analyze_candidates
from services.resume_parser import extract_resume_data, calculate_ats_score
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI(title="AI Resume ATS", version="2.0")

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# AUTH
# =========================
def get_user(authorization: str = Header(None)):

    print("AUTH HEADER =", authorization)

    if not authorization:
        raise HTTPException(status_code=401, detail="No token")

    token = authorization.replace("Bearer ", "").strip()

    print("TOKEN =", token[:30])

    try:
        auth_result = supabase.auth.get_user(token)

    except AuthApiError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    if not auth_result or not auth_result.user:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    return auth_result.user
# =========================
# ROOT
# =========================
@app.get("/")
def home():
    return {"status": "running"}

# =========================
# HEALTH
# =========================
@app.get("/health")
def health():
    return {"status": "ok"}

# =========================
# RESUME LIST
# =========================
@app.get("/resumes")
def get_resumes(user=Depends(get_user)):

    try:

        result = supabase.table("candidates") \
            .select("*") \
            .eq("hr_id", str(user.id)) \
            .order("created_at", desc=True) \
            .execute()

        return {
            "status": "success",
            "data": result.data or []
        }

    except Exception as e:

        print("GET RESUMES ERROR:", e)

        return {
            "status": "failed",
            "error": str(e)
        }

# =========================
# UPLOAD RESUME
# =========================
import re
import io
import PyPDF2
import pdfplumber
from docx import Document
from fastapi import UploadFile, File, Depends

# =========================
# TEXT EXTRACTION (FIXED)
# =========================
def extract_text_from_file(file_bytes, filename):

    try:
        # PDF
        if filename.endswith(".pdf"):
            text = ""
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            return text

        # DOCX
        elif filename.endswith(".docx"):
            doc = Document(io.BytesIO(file_bytes))
            return "\n".join([p.text for p in doc.paragraphs])

        return ""

    except Exception as e:
        print("TEXT EXTRACTION ERROR:", e)
        return ""


# =========================
# RESUME PARSER (SAFE)
# =========================
def parse_resume(text):

    # NAME
    name_match = re.search(
        r"Name\s*:\s*(.+)",
        text,
        re.IGNORECASE
    )

    name = (
        name_match.group(1).strip()
        if name_match
        else "Unknown"
    )

    # EMAIL
    email_match = re.search(
        r'[\w\.-]+@[\w\.-]+\.\w+',
        text
    )

    email = email_match.group() if email_match else None

    # PHONE
    phone_match = re.search(
        r'(?:\+91)?[6-9]\d{9}',
        text
    )

    phone = phone_match.group() if phone_match else None

    # SKILLS
    skills_match = re.search(
        r"Skills\s*:\s*(.*?)\s*Project:",
        text,
        re.IGNORECASE | re.DOTALL
    )

    skills = (
        skills_match.group(1).replace("\n", " ").strip()
        if skills_match
        else None
    )

    # LOCATION
    location_match = re.search(
        r"Location\s*:\s*(.+)",
        text,
        re.IGNORECASE
    )

    location = (
        location_match.group(1).strip()
        if location_match
        else None
    )

    # COLLEGE
    college_match = re.search(
        r"College\s*:\s*(.+)",
        text,
        re.IGNORECASE
    )

    college_name = (
        college_match.group(1).strip()
        if college_match
        else None
    )

    # PASSOUT YEAR
    passout_match = re.search(
        r"Passout\s*Year\s*:\s*(\d{4})",
        text,
        re.IGNORECASE
    )

    passout_year = (
        passout_match.group(1)
        if passout_match
        else None
    )

    # INTERNSHIP
    internship_match = re.search(
        r"Internship\s*:\s*(.+)",
        text,
        re.IGNORECASE
    )

    internship = (
        internship_match.group(1).strip()
        if internship_match
        else None
    )

    # CERTIFICATION
    certification_match = re.search(
        r"Certification\s*:\s*(.+)",
        text,
        re.IGNORECASE
    )

    certification = (
        certification_match.group(1).strip()
        if certification_match
        else None
    )

    # EXPERIENCE
    experience_match = re.search(
        r"Experience\s*:\s*(.+)",
        text,
        re.IGNORECASE
    )

    experience = (
        experience_match.group(1).strip()
        if experience_match
        else None
    )

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "college_name": college_name,
        "skills": skills,
        "location": location,
        "passout_year": passout_year,
        "internship_details": internship,
        "certification_details": certification,
        "experience_details": experience
    }


# =========================
# UPLOAD API (FINAL FIX)
# =========================
@app.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user=Depends(get_user)
):
    try:
        # =====================
        # READ FILE
        # =====================
        file_bytes = await file.read()
        file_path = f"{user.id}/{file.filename}"

        # =====================
        # STORAGE
        # =====================
        storage_res = supabase.storage.from_("resumes").upload(
            file_path,
            file_bytes,
            {
                "content-type": file.content_type,
                "upsert": "true"
            }
        )

        print("STORAGE OK:", storage_res)

        # =====================
        # DEBUG FILE INFO
        # =====================
        print("FILE NAME:", file.filename)
        print("FILE SIZE:", len(file_bytes))
        print("FIRST 20 BYTES:", file_bytes[:20])

        # =====================
        # TEXT EXTRACTION
        # =====================
        text = extract_text_from_file(file_bytes, file.filename)

        print("TEXT LENGTH:", len(text))
        print("FIRST 500 CHARS:")
        print(text[:500] if text else "NO TEXT EXTRACTED")

        # =====================
        # PARSE RESUME
        # =====================
        parsed = parse_resume(text)

        print("PARSED DATA:", parsed)

        # =====================
        # INSERT CANDIDATE
        # =====================
        candidate_res = supabase.table("candidates").insert({
            "hr_id": str(user.id),
            "name": parsed.get("name"),
            "email": parsed.get("email"),
            "phone": parsed.get("phone"),
            "location": parsed.get("location"),
            "college_name": parsed.get("college_name"),
            "passout_year": parsed.get("passout_year"),
            "skills": parsed.get("skills"),
            "internship_details": parsed.get("internship_details"),
            "certification_details": parsed.get("certification_details"),
            "experience_details": parsed.get("experience_details"),
            "status": "New",
            "ats_score": 0,
            "jd_match_percentage": 0,
            "resume_url": file_path
        }).execute()

        print("DB INSERT RESULT:", candidate_res)

        # =====================
        # GET CANDIDATE ID
        # =====================
        candidate_id = None

        if candidate_res.data and len(candidate_res.data) > 0:
            candidate_id = candidate_res.data[0].get("id")

        print("CANDIDATE ID:", candidate_id)

        # =====================
        # INSERT RESUME LINK
        # =====================
        if candidate_id:
            supabase.table("resume_uploads").insert({
                "hr_id": str(user.id),
                "file_name": file.filename,
                "file_path": file_path,
                "candidate_id": candidate_id
            }).execute()

        return {
            "status": "success",
            "candidate_id": candidate_id,
            "message": "Upload + DB Save Success"
        }

    except Exception as e:
        print("UPLOAD FAILED:", str(e))

        return {
            "status": "failed",
            "error": str(e)
        }
# =========================
# JD ANALYSIS
# =========================
from fastapi import Depends
from services.resume_parser import calculate_ats_score

@app.post("/analyze-jd")
def analyze_jd(payload: dict, user=Depends(get_user)):

    try:
        jd_text = payload.get("job_description", "")

        if not jd_text:
            return {
                "status": "failed",
                "error": "Job description is empty"
            }

        # =========================
        # GET HR CANDIDATES
        # =========================
        resumes = supabase.table("resume_uploads") \
            .select("*") \
            .eq("hr_id", str(user.id)) \
            .execute()

        results = []

        # =========================
        # LOOP CANDIDATES
        # =========================
        for r in resumes.data or []:

            try:

                candidate_res = supabase.table("candidates") \
                    .select("*") \
                    .eq("id", r.get("candidate_id")) \
                    .single() \
                    .execute()

                candidate = candidate_res.data

                if not candidate:
                    continue

                # =========================
                # BUILD RESUME TEXT
                # =========================
                resume_text = " ".join(
                    str(v)
                    for v in candidate.values()
                    if v
                )

                # =========================
                # ATS ANALYSIS
                # =========================
                analysis = calculate_ats_score(
                    resume_text,
                    jd_text
                )

                score = analysis["score"]

                # =========================
                # SAVE SCORE TO DATABASE
                # =========================
                supabase.table("candidates").update({
                    "ats_score": score,
                    "jd_match_percentage": score
                }).eq(
                    "id",
                    r.get("candidate_id")
                ).execute()

                # =========================
                # RESPONSE DATA
                # =========================
                results.append({
                    "candidate_id": r.get("candidate_id"),
                    "name": candidate.get("name"),
                    "email": candidate.get("email"),
                    "phone": candidate.get("phone"),
                    "location": candidate.get("location"),
                    "college_name": candidate.get("college_name"),
                    "skills": candidate.get("skills"),

                    "score": score,

                    "matched_keywords":
                        analysis.get(
                            "matched_keywords",
                            []
                        ),

                    "missing_keywords":
                        analysis.get(
                            "missing_keywords",
                            []
                        )
                })

            except Exception as inner_e:

                print(
                    "CANDIDATE ERROR:",
                    inner_e
                )

                continue

        # =========================
        # SORT BY ATS SCORE
        # =========================
        results = sorted(
            results,
            key=lambda x: x["score"],
            reverse=True
        )

        return {
            "status": "success",
            "total_candidates": len(results),
            "data": results
        }

    except Exception as e:

        print(
            "JD ANALYSIS ERROR:",
            e
        )

        return {
            "status": "failed",
            "error": str(e)
        }
# =========================
# DASHBOARD
# =========================
@app.get("/dashboard")
def dashboard(user=Depends(get_user)):

    result = supabase.table("candidates")\
        .select("*") \
        .eq("hr_id", str(user.id)) \
        .execute()

    candidates = result.data or []

    stats = {
        "total_candidates": len(candidates),
        "new_candidates": 0,
        "selected": 0,
        "rejected": 0
    }

    for c in candidates:

        status = (c.get("status", "") or "").strip().lower()

        if status == "new":
            stats["new_candidates"] += 1
        elif status == "selected":
            stats["selected"] += 1
        elif status == "rejected":
            stats["rejected"] += 1

    return {
        "status": "success",
        "data": stats
    }

# =========================
# CSV EXPORT
# =========================
from fastapi import Query

@app.get("/export/csv")
def export_csv(
    user=Depends(get_user),
    location: str = Query(None),
    status: str = Query(None),
    skills: str = Query(None)
):

    query = supabase.table("candidates") \
        .select("*") \
        .eq("hr_id", str(user.id))

    result = query.execute()

    data = result.data or []

    # FILTERS
    if location:
        data = [
            x for x in data
            if location.lower() in (x.get("location") or "").lower()
        ]

    if status:
        data = [
            x for x in data
            if status.lower() == (x.get("status") or "").lower()
        ]

    if skills:
        data = [
            x for x in data
            if skills.lower() in (x.get("skills") or "").lower()
        ]

    df = pd.DataFrame(data)

    stream = io.StringIO()

    df.to_csv(stream, index=False)

    stream.seek(0)

    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=candidates.csv"
        }
    )

# =========================
# EXCEL EXPORT
# =========================
from fastapi import Query

@app.get("/export/excel")
def export_excel(
    user=Depends(get_user),
    location: str = Query(None),
    status: str = Query(None),
    skills: str = Query(None)
):

    query = supabase.table("candidates") \
        .select("*") \
        .eq("hr_id", str(user.id))

    result = query.execute()

    data = result.data or []

    # FILTERS
    if location:
        data = [
            x for x in data
            if location.lower() in (x.get("location") or "").lower()
        ]

    if status:
        data = [
            x for x in data
            if status.lower() == (x.get("status") or "").lower()
        ]

    if skills:
        data = [
            x for x in data
            if skills.lower() in (x.get("skills") or "").lower()
        ]

    df = pd.DataFrame(data)

    stream = io.BytesIO()

    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df.to_excel(
            writer,
            index=False,
            sheet_name="Candidates"
        )

    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition":
            "attachment; filename=candidates.xlsx"
        }
    )
    # =========================
# CANDIDATE STATUS UPDATE
# =========================

from pydantic import BaseModel

class StatusUpdateRequest(BaseModel):
    id: str
    status: str


@app.put("/candidate-status")
def update_candidate_status(
    payload: StatusUpdateRequest
):
    try:

        result = supabase.table("candidates").update({
            "status": payload.status
        }).eq(
            "id",
            payload.id
        ).execute()

        return {
            "status": "success",
            "data": result.data
        }

    except Exception as e:

        return {
            "status": "failed",
            "error": str(e)
        }
# =========================
# CANDIDATE NOTES UPDATE
# =========================

class CandidateNotesRequest(BaseModel):
    id: str
    remarks: str = ""
    internal_notes: str = ""
    follow_up_date: str = ""


@app.put("/candidate-notes")
def update_candidate_notes(
    payload: CandidateNotesRequest
):
    try:

        result = supabase.table("candidates").update({

            "remarks": payload.remarks,

            "internal_notes":
                payload.internal_notes,

            "follow_up_date":
                payload.follow_up_date

        }).eq(
            "id",
            payload.id
        ).execute()

        return {
            "status": "success",
            "data": result.data
        }

    except Exception as e:

        return {
            "status": "failed",
            "error": str(e)
        }

# =========================
# GET SINGLE CANDIDATE
# =========================

@app.get("/candidate/{candidate_id}")
def get_candidate(
    candidate_id: str,
    user=Depends(get_user)
):

    result = supabase.table("candidates") \
        .select("*") \
        .eq("id", candidate_id) \
        .eq("hr_id", str(user.id)) \
        .single() \
        .execute()

    return result.data