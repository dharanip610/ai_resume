const API_BASE = "http://127.0.0.1:8000";

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
                            onclick="contacted('${r.id}')">

                            Contacted

                        </button>

                        <button
                            onclick="rejectDemo('${r.id}')">

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

function contacted(id) {

    alert(
        "Contacted: " + id
    );
}

function rejectDemo(id) {

    alert(
        "Reject Demo: " + id
    );
}

loadDemoRequests();

