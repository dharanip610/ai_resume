from pathlib import Path
import shutil

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.parser import extract_resume_data
from backend.supabase_client import insert_data, load_data
from backend.excel_export import generate_excel
from backend.jd_analyzer import analyze_candidates

# =========================
# APP
# =========================

app = FastAPI(title="AI Resume System")

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
# UPLOAD FOLDER
# =========================

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# =========================
# MODEL
# =========================

class JDRequest(BaseModel):
    job_description: str

# =========================
# CLEAN TEXT
# =========================

def clean_text(value):

    if value is None:
        return ""

    return str(value) \
        .replace("\x00", "") \
        .replace("\u0000", "") \
        .strip()

# =========================
# HOME
# =========================

@app.get("/")
def home():

    return {
        "status": "AI Resume Backend Running 🚀"
    }

# =========================
# UPLOAD RESUME
# =========================

@app.post("/upload")
async def upload(file: UploadFile = File(...)):

    try:

        file_path = UPLOAD_DIR / file.filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        extracted = extract_resume_data(str(file_path))

        data = {

            "filename": file.filename,

            "status": "parsed",

            "name": clean_text(
                extracted.get("name")
            ),

            "email": clean_text(
                extracted.get("email")
            ),

            "phone": clean_text(
                extracted.get("phone")
            ),

            "skills": clean_text(
                extracted.get("skills")
            ),

            "raw_text": clean_text(
                extracted.get("raw_text")
            )
        }

        insert_data(data)

        return {
            "message": "uploaded successfully",
            "data": data
        }

    except Exception as e:

        print("UPLOAD ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================
# GET RESUMES
# =========================

@app.get("/resumes")
def get_resumes():

    try:

        data = load_data()

        return {
            "count": len(data),
            "data": data
        }

    except Exception as e:

        print("RESUME ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================
# ANALYZE JD
# =========================

@app.post("/analyze-jd")
def analyze(payload: JDRequest):

    try:

        resumes = load_data()

        if not resumes:

            return {
                "jd_skills": [],
                "top_candidates": []
            }

        return analyze_candidates(
            resumes,
            payload.job_description
        )

    except Exception as e:

        print("ANALYZE ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================
# EXPORT EXCEL
# =========================

@app.get("/export")
def export_excel():

    try:

        file_path = generate_excel()

        return FileResponse(
            path=file_path,
            filename="resumes.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    except Exception as e:

        print("EXPORT ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )