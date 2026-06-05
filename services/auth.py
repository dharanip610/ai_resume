from fastapi import Header, HTTPException
from services.supabase_client import supabase


def get_current_user(authorization: str = Header(None)):

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.replace("Bearer ", "")

    try:
        user = supabase.auth.get_user(token)

        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user.user

    except Exception:
        raise HTTPException(status_code=401, detail="Auth failed")