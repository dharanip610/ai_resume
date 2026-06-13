const API_BASE = "http://127.0.0.1:8000";

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
onclick="approveRequest('${r.id}')">

Approve

</button>

<button
class="reject-btn"
onclick="rejectRequest('${r.id}')">

Reject

</button>

</td>
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

        console.log(data);

        alert(
            "Request Approved Successfully"
        );

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

