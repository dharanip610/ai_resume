import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing Supabase credentials in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

TABLE_NAME = "resumes"

def insert_data(data):
    return supabase.table(TABLE_NAME).insert(data).execute()

def load_data():
    return supabase.table(TABLE_NAME).select("*").execute().data