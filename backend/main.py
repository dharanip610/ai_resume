from pathlib import Path
import shutil

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.parser import extract_resume_data
from backend.supabase_client import insert_data, load_data
from backend.excel_export import generate_excel
from backend.jd_analyzer import analyze_candidates   # 🔥 FIX ADDED

app = FastAPI(title="AI Resume System")

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# UPLOAD DIR
# =========================
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# =========================
# MODEL
# =========================
class JDRequest(BaseModel):
    job_description: str


# =========================
# CLEAN FUNCTION
# =========================
def clean_text(value):
    if not value:
        return ""
    return str(value).replace("\x00", "").replace("\u0000", "")


# =========================
# HOME
# =========================
@app.get("/")
def home():
    return {"status": "AI Resume Backend Running 🚀"}


# =========================
# UPLOAD RESUME
# =========================
@app.post("/upload")
async def upload(file: UploadFile = File(...)):

    try:
        file_path = UPLOAD_DIR / file.filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # parse resume
        data = extract_resume_data(str(file_path))

        # clean + safe insert
        data = {
            "name": clean_text(data.get("name")),
            "email": clean_text(data.get("email")),
            "phone": clean_text(data.get("phone")),
            "skills": clean_text(data.get("skills")),
            "raw_text": clean_text(data.get("raw_text")),
            "filename": file.filename,
            "status": "parsed"
        }

        insert_data(data)

        return {"message": "uploaded successfully", "data": data}

    except Exception as e:
        print("UPLOAD ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# GET RESUMES
# =========================
@app.get("/resumes")
def resumes():

    try:
        data = load_data()

        if not data:
            return {"data": []}

        return {"data": data}

    except Exception as e:
        print("RESUME ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# 🔥 ANALYZE JD (FIXED + ADDED)
# =========================
@app.post("/analyze-jd")
def analyze(payload: JDRequest):

    try:
        resumes = load_data()

        if not resumes:
            return {
                "message": "No resumes found",
                "jd_skills": [],
                "top_candidates": []
            }

        result = analyze_candidates(resumes, payload.job_description)

        return result

    except Exception as e:
        print("ANALYZE ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# EXPORT EXCEL
# =========================
@app.get("/export")
def export():

    try:
        file_path = generate_excel()

        return FileResponse(
            path=file_path,
            filename="resumes.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    except Exception as e:
        print("EXPORT ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))