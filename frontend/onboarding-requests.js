const API_BASE = "https://ai-resume-xbi6.onrender.com";
let currentHR = {};

async function loadOnboardingRequests() {

    try {

        const token =
            localStorage.getItem(
                "access_token"
            );

        const res =
            await fetch(
                `${API_BASE}/admin/onboarding-requests`,
                {
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );

        const data =
            await res.json();

        const table =
            document.getElementById(
                "onboardingTable"
            );

        table.innerHTML =
            (data.data || [])
            .map(r => `
                <tr>
                    <td>${r.full_name}</td>
                    <td>${r.company_name}</td>
                    <td>${r.email}</td>
                    <td>${r.designation || "-"}</td>

                   <td class="action-buttons">

<button
class="approve-btn"
onclick="approveRequest('${r.id}')">

Approve

</button>

<button
class="reject-btn"
onclick="rejectRequest('${r.id}')">

Reject

</button>

</td> </tr>
            `)
            .join("");

    } catch (err) {

        console.error(
            err
        );
    }
}

async function approveRequest(id) {

    try {

        const token =
            localStorage.getItem(
                "access_token"
            );

        const res =
            await fetch(
                `${API_BASE}/admin/approve-onboarding/${id}`,
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );

        const data =
            await res.json();

        console.log(
            "DATA =",
            data
        );

        currentHR = {

    full_name:
        data.full_name,

    company_name:
        data.company_name,

    email:
        data.email,

    phone:
        data.phone,

    password:
        data.temp_password

};

        document
        .getElementById(
            "credentialBody"
        ).innerHTML = `

        <p>
            <b>Name:</b>
            ${currentHR.full_name}
        </p>

        <p>
            <b>Company:</b>
            ${currentHR.company_name}
        </p>

        <p>
            <b>Email:</b>
            ${currentHR.email}
        </p>
        <p>
            <b>Phone:</b>
            ${currentHR.phone}
        </p>

        <p>
            <b>Password:</b>
            ${currentHR.password}
        </p>

        <br>

        <button onclick="shareWhatsApp('${currentHR.email}','${currentHR.password}')">
            📱 WhatsApp
        </button>

        <button onclick="shareEmail('${currentHR.email}','${currentHR.password}')">
            ✉ Email
        </button>

        <button onclick="copyCredentials('${currentHR.email}','${currentHR.password}')">
            📋 Copy Credentials
        </button>

        `;

        document
        .getElementById(
            "credentialModal"
        )
        .style.display =
            "flex";

        loadOnboardingRequests();

    } catch (err) {

        console.error(err);

        alert(
            "Approval Failed"
        );
    }
}
async function rejectRequest(id) {

    try {

        const token =
            localStorage.getItem(
                "access_token"
            );

        const res =
            await fetch(
                `${API_BASE}/admin/reject-onboarding/${id}`,
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );

        const data =
            await res.json();

    console.log(data);

alert(
    "Request Rejected Successfully"
);

loadOnboardingRequests();    

    } catch (err) {

        console.error(err);

        alert(
            "Reject Failed"
        );
    }
}

loadOnboardingRequests();
function copyCredentials(
    email,
    password
){

    const text =

`Email: ${email}

Password: ${password}`;

    navigator.clipboard.writeText(
        text
    );

    alert(text);

}
function shareWhatsApp(
    email,
    password
){

    const message =
    encodeURIComponent(

`Hi,

Your ATS account has been created.

Login URL:
http://localhost:5500/login.html

Email:
${email}

Password:
${password}

Please change your password after login.

Regards,
ATS Team`

    );

window.open(
    `https://wa.me/91${currentHR.phone}?text=${message}`,
    "_blank"
);

}
function shareEmail(
    email,
    password
){

    const subject =
    encodeURIComponent(
        "ATS Login Credentials"
    );

    const body =
    encodeURIComponent(

`Hi,

Your ATS account has been created.

Login URL:
http://localhost:5500/login.html

Email:
${email}

Password:
${password}

Please change your password after login.

Regards,
ATS Team`

    );

    window.location.href =
    `mailto:${email}?subject=${subject}&body=${body}`;

}
function closeCredentialModal(){

    document
    .getElementById(
        "credentialModal"
    )
    .style.display = "none";

}
