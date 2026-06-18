const API_BASE =
"http://127.0.0.1:8000";

async function loadProfile(){

    try{

        const token =
        localStorage.getItem(
            "access_token"
        );

        const res =
        await fetch(
            `${API_BASE}/profile`,
            {
                headers:{
                    Authorization:
                    "Bearer " + token
                }
            }
        );

        const result =
        await res.json();

        const p =
        result.data;

        document.getElementById(
            "fullName"
        ).innerText =
        p.full_name || "-";

        document.getElementById(
            "companyName"
        ).innerText =
        p.company_name || "-";

        document.getElementById(
            "email"
        ).innerText =
        p.email || "-";

        document.getElementById(
            "phone"
        ).innerText =
        p.phone || "-";

        document.getElementById(
            "designation"
        ).innerText =
        p.designation || "-";

        document.getElementById(
            "subscription"
        ).innerText =
        p.subscription_status || "-";

        document.getElementById(
            "trialEnd"
        ).innerText =
        p.trial_end_date || "-";

        document.getElementById(
            "resumeCount"
        ).innerText =
        p.resume_count || 0;

    }
    catch(err){

        console.error(err);

    }

}

loadProfile();
async function changePassword(){

    const currentPassword =
    document.getElementById(
        "currentPassword"
    ).value;

    const newPassword =
    document.getElementById(
        "newPassword"
    ).value;

    const confirmPassword =
    document.getElementById(
        "confirmPassword"
    ).value;
    if(
    !currentPassword ||
    !newPassword ||
    !confirmPassword
){

    alert(
        "All fields are required"
    );

    return;
}

    if(
        newPassword !==
        confirmPassword
    ){

        alert(
            "Passwords do not match"
        );

        return;
    }

    try{

        const token =
        localStorage.getItem(
            "access_token"
        );

        const res =
        await fetch(
            `${API_BASE}/change-password`,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json",

                    Authorization:
                    "Bearer " + token
                },

                body:JSON.stringify({

                    current_password:
                    currentPassword,

                    new_password:
                    newPassword

                })
            }
        );

        const data =
        await res.json();
        console.log(data);
        document.getElementById(
    "msg"
).innerText =
data.message ||
data.detail ||
"Success";

    }
    catch(err){

        console.error(err);

        alert(
            "Password update failed"
        );
    }
}
