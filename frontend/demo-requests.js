const API_BASE = "http://127.0.0.1:8000";
let allDemoRequests = [];
async function loadDemoRequests() {

    try {

        const token =
            localStorage.getItem(
                "access_token"
            );

        const res =
            await fetch(
                `${API_BASE}/admin/demo-requests`,
                {
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );

        const data =
            await res.json();
            allDemoRequests =
            data.data || []; 

        const table =
            document.getElementById(
                "demoTable"
            );

        table.innerHTML =
            (data.data || [])
            .map(r => `
                <tr>
                    <td>${r.full_name}</td>
                    <td>${r.company_name}</td>
                    <td>${r.email}</td>

                    <td>
<button
class="contacted-btn"
onclick="viewContact('${r.id}')">

Contact

</button>


<button
class="reject-btn"
onclick="rejectRequest('${r.id}')">

Reject

</button>

                    </td>
                </tr>
            `)
            .join("");

    } catch (err) {

        console.error(
            err
        );
    }
}
function viewContact(id){

    const demo =
        allDemoRequests.find(
            r => r.id == id
        );

    if(!demo){

        alert("Request not found");
        return;

    }

    const whatsappMsg =
    encodeURIComponent(

`Hi ${demo.full_name},

Thank you for your interest in AI ATS Platform.

We received your demo request and would like to schedule a discussion.

Regards,
ATS Team`

    );

    const whatsappUrl =
    `https://wa.me/91${demo.phone}?text=${whatsappMsg}`;

    const emailUrl =
    `mailto:${demo.email}
?subject=AI ATS Demo Request
&body=Hi ${demo.full_name},

Thank you for your demo request.

We would like to discuss your ATS requirements.

Regards,
ATS Team`;

    document.getElementById(
        "contactModalBody"
    ).innerHTML = `

    <h2>${demo.full_name}</h2>

    <p>
        <b>Company:</b>
        ${demo.company_name}
    </p>

    <p>
        <b>Phone:</b>
        ${demo.phone || "-"}
    </p>

    <p>
        <b>Email:</b>
        ${demo.email}
    </p>

    <div class="contact-actions">

        <a
            href="${whatsappUrl}"
            target="_blank"
            class="whatsapp-btn">

            📱 WhatsApp

        </a>

        <a
            href="${emailUrl}"
            class="email-btn">

            ✉ Email

        </a>

    </div>

    `;

    document.getElementById(
        "contactModal"
    ).style.display =
    "flex";

}
async function contacted(id) {

    try {

        const token =
            localStorage.getItem(
                "access_token"
            );

        const res =
            await fetch(
                `${API_BASE}/admin/contact-demo/${id}`,
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
            "Demo Request Marked As Contacted"
        );

        loadDemoRequests();

    } catch (err) {

        console.error(err);

        alert(
            "Contact Failed"
        );
    }
}

async function rejectDemo(id) {

    try {

        const token =
            localStorage.getItem(
                "access_token"
            );

        const res =
            await fetch(
                `${API_BASE}/admin/reject-demo/${id}`,
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
            "Demo Request Rejected Successfully"
        );

        loadDemoRequests();

    } catch (err) {

        console.error(err);

        alert(
            "Reject Failed"
        );
    }
}
loadDemoRequests();
