from fastapi import Header, HTTPException
from datetime import date
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
        profile = supabase.table(
            "profiles"
        ).select(
            "role,trial_end_date,subscription_status"
        ).eq(
            "id",
            str(user.user.id)
        ).single().execute()

        if profile.data:

            role = profile.data.get("role")

            trial_end = profile.data.get(
                "trial_end_date"
            )

            if role == "hr" and trial_end:

                if date.today() > date.fromisoformat(trial_end):

                    raise HTTPException(
                        status_code=403,
                        detail="Subscription Expired"
                    )
            return user.user
    except HTTPException:
        raise

    except Exception as e:

        print("AUTH ERROR =", str(e))

        raise HTTPException(
            status_code=401,
            detail=str(e)
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