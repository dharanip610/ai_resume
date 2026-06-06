from fastapi import Header, HTTPException
from services.supabase_client import supabase


def get_current_user(
    authorization: str = Header(None)
):

    print("AUTH HEADER =", authorization)

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing token"
        )

    token = authorization.replace(
        "Bearer ",
        ""
    )

    try:

        user = supabase.auth.get_user(token)

        print("USER RESPONSE =", user)

        if not user or not user.user:

            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return user.user

    except Exception as e:

        print("AUTH ERROR =", str(e))

        raise HTTPException(
            status_code=401,
            detail="Auth failed"
        )


# =========================
# ROLE HELPER
# =========================

def get_user_role(user_id: str):

    result = supabase.table(
        "profiles"
    ).select(
        "role"
    ).eq(
        "id",
        user_id
    ).single().execute()

    if result.data:

        return result.data.get(
            "role",
            "hr"
        )

    return "hr"