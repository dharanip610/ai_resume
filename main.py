from pydoc import text

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
from fastapi.responses import RedirectResponse
from scipy import stats
from supabase_auth.errors import AuthApiError
from fastapi.middleware.cors import CORSMiddleware
from services.resume_parser import extract_resume_data
from services.supabase_client import supabase
from services.jd_analyzer import analyze_candidates
from services.resume_parser import extract_resume_data, calculate_ats_score
from services.auth import get_current_user, get_user_role
from pydantic import BaseModel
from fastapi import Body

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

    import re

    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    # =====================
    # EMAIL
    # =====================
    email_match = re.search(
        r'[\w\.-]+@[\w\.-]+\.\w+',
        text
    )

    email = (
        email_match.group(0)
        if email_match
        else None
    )

    # =====================
    # PHONE
    # =====================
    phone_match = re.search(
        r'(?:\+91)?[6-9]\d{9}',
        text
    )

    phone = (
        phone_match.group(0)
        if phone_match
        else None
    )

    # =====================
    # NAME
    # =====================
    name = "Unknown"

    name_match = re.search(
        r"Name\s*:\s*(.+)",
        text,
        re.IGNORECASE
    )

    if name_match:

        name = name_match.group(1).strip()

    else:

        for line in lines[:10]:

            if (
                "@" not in line
                and not re.search(r"\d{10}", line)
                and len(line.split()) <= 5
                and len(line) > 2
            ):
                name = line
                break

    # =====================
    # LOCATION
    # =====================
    location = None

    location_match = re.search(
        r"Location\s*:\s*(.+)",
        text,
        re.IGNORECASE
    )

    if location_match:
        location = location_match.group(1).strip()

    # =====================
    # COLLEGE
    # =====================
    college_name = None

    for line in lines:

        lower = line.lower()

        if (
            "college" in lower
            or "university" in lower
            or "institute" in lower
            or "school" in lower
        ):
            college_name = line
            break

    # =====================
    # PASSOUT YEAR
    # =====================
    passout_year = None

    years = re.findall(
        r"\b20\d{2}\b",
        text
    )

    if years:

        valid_years = [
            y for y in years
            if 2020 <= int(y) <= 2035
        ]

        if valid_years:
            passout_year = max(valid_years)

    # =====================
    # SKILLS
    # =====================
    skill_db = [
        "python",
        "java",
        "sql",
        "html",
        "css",
        "javascript",
        "react",
        "reactjs",
        "node",
        "nodejs",
        "express",
        "mongodb",
        "mysql",
        "fastapi",
        "django",
        "flask",
        "excel",
        "power bi",
        "aws",
        "azure",
        "typescript",
        "c",
        "c++"
    ]

    text_lower = text.lower()

    skills_found = []

    for skill in skill_db:

        if skill in text_lower:
            skills_found.append(skill)

    skills = (
        ", ".join(sorted(set(skills_found)))
        if skills_found
        else None
    )

    # =====================
    # INTERNSHIP
    # =====================
    internship_details = None

    internship_match = re.search(
        r"INTERNSHIP(.*?)(CERTIFICATION|PROJECT|EXPERIENCE|$)",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if internship_match:

        internship_details = (
            internship_match.group(1)
            .strip()[:1000]
        )

    # =====================
    # CERTIFICATION
    # =====================
    certification_details = None

    certification_match = re.search(
        r"CERTIFICATION(S)?(.*?)(PROJECT|WORKSHOP|EXPERIENCE|LANGUAGE|$)",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if certification_match:

        certification_details = (
            certification_match.group(2)
            .strip()[:1000]
        )

    # =====================
    # EXPERIENCE
    # =====================
    experience_details = None

    experience_match = re.search(
        r"EXPERIENCE(.*?)(PROJECT|CERTIFICATION|LANGUAGE|$)",
        text,
        re.IGNORECASE | re.DOTALL
    )

    if experience_match:

        experience_details = (
            experience_match.group(1)
            .strip()[:1000]
        )

    # =====================
    # RETURN
    # =====================
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "college_name": college_name,
        "skills": skills,
        "location": location,
        "passout_year": passout_year,
        "internship_details": internship_details,
        "certification_details": certification_details,
        "experience_details": experience_details
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

        public_url = supabase.storage.from_("resumes").get_public_url(file_path)

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
            "resume_text": text,
            "status": "New",
            "ats_score": 0,
            "jd_match_percentage": 0,
            "resume_url": public_url
        }).execute()

        print("DB INSERT RESULT:", candidate_res)

        # GET CANDIDATE ID
        candidate_id = None
        if getattr(candidate_res, 'data', None) and len(candidate_res.data) > 0:
            candidate_id = candidate_res.data[0].get("id")

        print("CANDIDATE ID:", candidate_id)

        # INSERT RESUME LINK
        if candidate_id:
            supabase.table("resume_uploads").insert({
                "hr_id": str(user.id),
                "file_name": file.filename,
                "file_path": file_path,
                "candidate_id": candidate_id
            }).execute()

        return {"status": "success", "candidate_id": candidate_id, "message": "Upload + DB Save Success"}

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

        candidates = supabase.table("candidates") \
            .select("*") \
            .eq("hr_id", str(user.id)) \
            .execute()

        results = []

        for candidate in candidates.data or []:
            try:
                resume_text = candidate.get("resume_text") or " ".join(
                    str(v)
                    for v in candidate.values()
                    if v
                )

                analysis = calculate_ats_score(
                    resume_text,
                    jd_text
                )

                print("RESUME =", resume_text[:200])
                print("JD =", jd_text)
                print("ANALYSIS =", analysis)

                if isinstance(analysis, int):
                    score = analysis
                    matched_keywords = []
                    missing_keywords = []
                else:
                    score = analysis.get("score", 0)
                    matched_keywords = analysis.get(
                        "matched_keywords",
                        []
                    )
                    missing_keywords = analysis.get(
                        "missing_keywords",
                        []
                    )

                supabase.table("candidates").update({
                    "ats_score": score,
                    "jd_match_percentage": score
                }).eq(
                    "id",
                    candidate.get("id")
                ).execute()

                results.append({
                    "candidate_id": candidate.get("id"),
                    "name": candidate.get("name"),
                    "email": candidate.get("email"),
                    "phone": candidate.get("phone"),
                    "location": candidate.get("location"),
                    "college_name": candidate.get("college_name"),
                    "skills": candidate.get("skills"),
                    "score": score,
                    "matched_keywords": matched_keywords,
                    "missing_keywords": missing_keywords
                })
            except Exception as inner_e:
                print(
                    "CANDIDATE ERROR:",
                    inner_e
                )
                continue

        results = sorted(
            results,
            key=lambda x: x["score"],
            reverse=True
        )

        # REMOVE DUPLICATES

        seen_emails = set()
        unique_results = []

        for r in results:
            email = r.get("email")
            if email not in seen_emails:
                unique_results.append(r)
                seen_emails.add(email)

        results = unique_results

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
# ==========================================
# CANDIDATE STATUS / NOTES UPDATE API
# ==========================================

from pydantic import BaseModel

class CandidateUpdate(BaseModel):

    # Candidate current recruitment status
    status: str | None = None

    # HR remarks visible in candidate profile
    remarks: str | None = None

    # Internal HR notes
    internal_notes: str | None = None

    # Next follow-up date
    followup_date: str | None = None


# ==========================================
# UPDATE CANDIDATE
# ==========================================
# Used from Candidates Page Modal
#
# Features:
# - Update Status
# - Save Remarks
# - Save Internal Notes
# - Save Follow Up Date
# ==========================================

@app.put("/candidate/{candidate_id}")
def update_candidate(

    candidate_id: str,
    payload: CandidateUpdate,
    user=Depends(get_user)

):

    try:

        update_data = {}

        # --------------------------
        # STATUS
        # --------------------------
        if payload.status is not None:

            update_data["status"] = (
                payload.status
            )

        # --------------------------
        # REMARKS
        # --------------------------
        if payload.remarks is not None:

            update_data["remarks"] = (
                payload.remarks
            )

        # --------------------------
        # INTERNAL NOTES
        # --------------------------
        if payload.internal_notes is not None:

            update_data[
                "notes"
            ] = payload.internal_notes

        # --------------------------
        # FOLLOW UP DATE
        # --------------------------
        if payload.followup_date is not None:

            update_data[
                "followup_date"
            ] = payload.followup_date

        # --------------------------
        # UPDATE DATABASE
        # --------------------------
        supabase.table(
            "candidates"
        ).update(
            update_data
        ).eq(
            "id",
            candidate_id
        ).execute()

        return {

            "status": "success",

            "message":
                "Candidate updated successfully"

        }

    except Exception as e:

        print(
            "UPDATE ERROR:",
            e
        )

        return {

            "status": "failed",

            "error":
                str(e)

        }

# =========================
# DASHBOARD
# =========================
@app.get("/dashboard")
def dashboard(user=Depends(get_user)):

    role = get_user_role(
        str(user.id)
    )

    if role == "admin":

        result = supabase.table("candidates") \
            .select("*") \
            .execute()

    else:

        result = supabase.table("candidates") \
            .select("*") \
            .eq("hr_id", str(user.id)) \
            .execute()

    print("USER ID =", user.id)
    print("ROLE =", role)
    print("RESULT DATA =", result.data)

    candidates = result.data or []

    stats = {
        "total_candidates": len(candidates),
        "new_candidates": 0,
        "selected": 0,
        "rejected": 0,
        "average_ats_score": 0,
        "candidates_analyzed": 0,
        "followups_due": 0
    }

    for c in candidates:

        status = (c.get("status", "") or "").strip().lower()

        if status == "new":
            stats["new_candidates"] += 1

        elif status == "selected":
            stats["selected"] += 1

        elif status == "rejected":
            stats["rejected"] += 1

        ats_score = c.get("ats_score") or 0

        stats["average_ats_score"] += ats_score

        if ats_score > 0:
            stats["candidates_analyzed"] += 1

        if c.get("followup_date"):
            stats["followups_due"] += 1

    if candidates:

        stats["average_ats_score"] = round(
            stats["average_ats_score"] /
            len(candidates)
        )

    return {
        "status": "success",
        "data": stats
    }
# =========================
# EXCEL EXPORT
# =========================
from fastapi import Query, Depends

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
            if location.lower()
            in (x.get("location") or "").lower()
        ]

    if status:
        data = [
            x for x in data
            if status.lower()
            == (x.get("status") or "").lower()
        ]

    if skills:
        data = [
            x for x in data
            if skills.lower()
            in (x.get("skills") or "").lower()
        ]

    df = pd.DataFrame(data)

    stream = io.BytesIO()

    with pd.ExcelWriter(
        stream,
        engine="openpyxl"
    ) as writer:

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
# CSV EXPORT
# =========================
@app.get("/export/csv")
def export_csv(

    user=Depends(get_user),

    location: str = Query(None),
    status: str = Query(None),
    skills: str = Query(None)

):

    query = (
        supabase.table("candidates")
        .select("*")
        .eq("hr_id", str(user.id))
    )

    result = query.execute()

    data = result.data or []
    if location:
        data = [
            x for x in data
            if location.lower()
            in (x.get("location") or "").lower()
        ]

    if status:
        data = [
            x for x in data
            if status.lower()
            == (x.get("status") or "").lower()
        ]

    if skills:
        data = [
            x for x in data
            if skills.lower()
            in (x.get("skills") or "").lower()
        ]

    df = pd.DataFrame(data)

    stream = io.StringIO()

    df.to_csv(
        stream,
        index=False
    )

    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=candidates.csv"
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
    notes: str = ""
    followup_date: str = ""


@app.put("/candidate-notes")
def update_candidate_notes(
    payload: CandidateNotesRequest
):
    try:

        result = supabase.table("candidates").update({

            "remarks": payload.remarks,

            "notes": payload.notes,

            "followup_date": payload.followup_date

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
@app.get("/resumes")
def get_resumes(user=Depends(get_user)):

    print(
        "USER ID =",
        user.id
    )

    role = get_user_role(
        str(user.id)
    )

    print(
        "USER ROLE =",
        role
    )

    try:

        if role == "admin":

            result = supabase.table("candidates") \
                .select("*") \
                .order("created_at", desc=True) \
                .execute()

        else:

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

        print(
            "GET RESUMES ERROR:",
            e
        )

        return {
            "status": "failed",
            "error": str(e)
        }
# ==========================================
# Admin Stats API
# ==========================================
@app.get("/admin/stats")
def admin_stats(
    user=Depends(get_current_user)
):

    print("USER =", user)

    role = get_user_role(
        str(user.id)
    )

    print("ROLE =", role)

    if role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin only"
        )

    hr_users = supabase.table(
        "profiles"
    ).select("*").eq(
        "role",
        "hr"
    ).execute()

    candidates = supabase.table(
        "candidates"
    ).select("*").execute()

    onboarding = supabase.table(
        "onboarding_requests"
    ).select("*").eq(
        "status",
        "pending"
    ).execute()

    demo = supabase.table(
        "demo_requests"
    ).select("*").eq(
        "status",
        "pending"
    ).execute()

    return {
        "hr_count":
            len(hr_users.data or []),

        "resume_count":
            len(candidates.data or []),

        "active_count":
            len(hr_users.data or []),

        "pending_onboarding":
            len(onboarding.data or []),

        "pending_demo":
            len(demo.data or [])
    }
# ==========================================
# HR users API
# ==========================================
from fastapi import Body

# ==========================================
# CREATE HR
# ==========================================

@app.post("/admin/create-hr")
def create_hr(
    payload: dict = Body(...)
):
    print("CREATE HR API CALLED")
    try:

        email = payload.get("email")
        password = payload.get("password")

        if not email or not password:

            return {
                "status": "failed",
                "error": "Email and password required"
            }

        auth_user = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })

        user_id = auth_user.user.id

        supabase.table(
            "profiles"
        ).insert({
            "id": user_id,
            "email": email,
            "role": "hr"
        }).execute()

        return {
            "status": "success",
            "message": "HR created successfully"
        }

    except Exception as e:

        print("CREATE HR ERROR =", e)

        return {
            "status": "failed",
            "error": str(e)
        }


# ==========================================
# DELETE HR
# ==========================================

@app.delete("/admin/delete-hr")
def delete_hr(
    payload: dict = Body(...)
):

    try:

        hr_id = payload.get("id")

        supabase.table(
            "profiles"
        ).delete().eq(
            "id",
            hr_id
        ).execute()

        return {
            "status": "success"
        }

    except Exception as e:

        return {
            "status": "failed",
            "error": str(e)
        }
# ==========================================
# download resume file from storage
# ==========================================
@app.get("/download")
def download_resume(path: str):

    try:

        file = supabase.storage \
            .from_("resumes") \
            .create_signed_url(
                path,
                60
            )

        return RedirectResponse(
            file["signedURL"]
        )

    except Exception as e:

        return {
            "status": "failed",
            "error": str(e)
        }
# ==========================================
# DELETE CANDIDATE
# ==========================================
@app.delete("/candidate/{candidate_id}")
def delete_candidate(
    candidate_id: str,
    user=Depends(get_user)
):

    try:

        role = get_user_role(
            str(user.id)
        )

        query = supabase.table(
            "candidates"
        ).delete().eq(
            "id",
            candidate_id
        )

        if role != "admin":

            query = query.eq(
                "hr_id",
                str(user.id)
            )

        query.execute()

        return {
            "status": "success",
            "message": "Candidate deleted"
        }

    except Exception as e:

        return {
            "status": "failed",
            "error": str(e)
        }
@app.get("/admin/hr-users")
def get_hr_users(
    user=Depends(get_current_user)
):

    role = get_user_role(
        str(user.id)
    )

    if role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin only"
        )

    result = supabase.table(
        "profiles"
    ).select("*").execute()

    return {
        "status": "success",
        "data": result.data or []
    }
# ==========================================
# ONBOARDING REQUEST
# ==========================================

from fastapi import Body

@app.post("/onboarding-request")
def onboarding_request(
    payload: dict = Body(...)
):

    try:

        result = supabase.table(
            "onboarding_requests"
        ).insert({

            "full_name":
                payload.get("full_name"),

            "company_name":
                payload.get("company_name"),

            "email":
                payload.get("email"),

            "phone":
                payload.get("phone"),

            "designation":
                payload.get("designation"),

            "experience":
                payload.get("experience"),

            "status":
                "pending"

        }).execute()

        return {
            "status": "success",
            "message": "Request submitted successfully"
        }

    except Exception as e:

        return {
            "status": "failed",
            "error": str(e)
        }


# ==========================================
# DEMO REQUEST
# ==========================================

@app.post("/demo-request")
def demo_request(
    payload: dict = Body(...)
):

    try:

        result = supabase.table(
            "demo_requests"
        ).insert({

            "full_name":
                payload.get("full_name"),

            "company_name":
                payload.get("company_name"),

            "email":
                payload.get("email"),

            "phone":
                payload.get("phone"),

            "message":
                payload.get("message"),

            "status":
                "pending"

        }).execute()

        return {
            "status": "success",
            "message": "Demo request submitted"
        }

    except Exception as e:

        return {
            "status": "failed",
            "error": str(e)
        }
# ==========================================
# GET ONBOARDING REQUESTS
# ==========================================

@app.get("/admin/onboarding-requests")
def get_onboarding_requests(
    user=Depends(get_current_user)
):

    role = get_user_role(
        str(user.id)
    )

    if role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin only"
        )

    result = supabase.table(
        "onboarding_requests"
    ).select("*").eq(
        "status",
        "pending"
    ).execute()

    return {
        "status": "success",
        "data": result.data or []
    }


# ==========================================
# GET DEMO REQUESTS
# ==========================================

@app.get("/admin/demo-requests")
def get_demo_requests(
    user=Depends(get_current_user)
):

    role = get_user_role(
        str(user.id)
    )

    if role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin only"
        )

    result = supabase.table(
        "demo_requests"
    ).select("*").eq(
        "status",
        "pending"
    ).execute()

    return {
        "status": "success",
        "data": result.data or []
    }

# ==========================================
# APPROVE ONBOARDING REQUEST
# ==========================================

@app.post("/admin/approve-onboarding/{request_id}")
def approve_onboarding(
    request_id: int,
    user=Depends(get_current_user)
):

    role = get_user_role(
        str(user.id)
    )

    if role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin only"
        )

    supabase.table(
        "onboarding_requests"
    ).update({

        "status":
            "approved"

    }).eq(
        "id",
        request_id
    ).execute()

    return {
        "status":
            "success"
    }

# ==========================================
# REJECT ONBOARDING REQUEST
# ==========================================

@app.post("/admin/reject-onboarding/{request_id}")
def reject_onboarding(
    request_id: int,
    user=Depends(get_current_user)
):

    role = get_user_role(
        str(user.id)
    )

    if role != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin only"
        )

    supabase.table(
        "onboarding_requests"
    ).update({

        "status":
            "rejected"

    }).eq(
        "id",
        request_id
    ).execute()

    return {
        "status":
            "success"
    }


