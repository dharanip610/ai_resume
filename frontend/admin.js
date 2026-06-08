const API_BASE = "http://127.0.0.1:8000";

// ===============================
// LOAD ADMIN DATA
// ===============================
async function loadAdminData() {

    try {

       const token =
    localStorage.getItem(
        "access_token"
    );

const res = await fetch(
    `${API_BASE}/admin/stats`,
    {
        headers: {
            "Authorization":
                "Bearer " + token
        }
    }
);

        const data = await res.json();

        document.getElementById("hrCount").innerText = data.hr_count || 0;
        document.getElementById("resumeCount").innerText = data.resume_count || 0;
        document.getElementById("activeCount").innerText = data.active_count || 0;

    } catch (err) {
        console.error(err);
    }

    loadHRUsers();
}

// ===============================
// LOAD HR USERS
// ===============================
async function loadHRUsers() {

    try {

       const token =
    localStorage.getItem(
        "access_token"
    );

const res = await fetch(
    `${API_BASE}/admin/hr-users`,
    {
        headers: {
            "Authorization":
                "Bearer " + token
        }
    }
);
        const data = await res.json();

        const users = data.data || [];

        const table = document.getElementById("hrTable");

        table.innerHTML = users.map(u => `
            <tr>
                <td>${u.email}</td>
                <td>${u.role || "HR"}</td>
                <td>${u.status || "Active"}</td>

                <td>
                    <button onclick="deleteHR('${u.id}')">Delete</button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
        console.error(err);
    }
}

// ===============================
// CREATE HR USER
// ===============================
async function createHR() {

    const email = document.getElementById("hrEmail").value;
    const password = document.getElementById("hrPassword").value;
    const msg = document.getElementById("adminMsg");

    if (!email || !password) {
        msg.innerText = "Enter details";
        msg.style.color = "red";
        return;
    }

    try {

        const res = await fetch(`${API_BASE}/admin/create-hr`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) throw new Error();

        msg.innerText = "HR created successfully";
        msg.style.color = "green";

        loadHRUsers();

    } catch (err) {
        msg.innerText = "Failed to create HR";
        msg.style.color = "red";
    }
}

// ===============================
// DELETE HR USER
// ===============================
async function deleteHR(id) {

    try {

        await fetch(`${API_BASE}/admin/delete-hr`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });

        loadHRUsers();

    } catch (err) {
        alert("Delete failed");
    }
}

// INIT
loadAdminData(); 