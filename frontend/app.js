
// =========================
// LOAD CANDIDATES
// =========================
let allCandidates = [];

async function loadCandidates() {

    const token = getToken();

    const res = await fetch("http://127.0.0.1:8000/resumes", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const data = await res.json();

    allCandidates = data.data || [];

    render(allCandidates);
}

// =========================
// RENDER TABLE
// =========================
function render(data) {

    let html = "";

    data.forEach(c => {

        html += `
        <tr>

            <td>${c.name || "-"}</td>

            <td>${c.email || "-"}</td>

            <td>${c.phone || "-"}</td>

            <td>${c.college_name || "-"}</td>

            <td>${c.skills || "-"}</td>

            <td>
                <strong>
                    ${c.ats_score || 0}%
                </strong>
            </td>

            <td>
                <span class="badge ${c.status?.replace(" ", "")}">
                    ${c.status || "New"}
                </span>
            </td>

            <td>
                <button onclick="viewCandidate('${c.id}')">
                    View
                </button>
            </td>

        </tr>
        `;
    });

    document.getElementById("candidateTable").innerHTML = html;
}

// =========================
// FILTER
// =========================
function filterData() {

    const search = document.getElementById("searchInput").value.toLowerCase();
    const status = document.getElementById("statusFilter").value;

    let filtered = allCandidates;

    if (status) {
        filtered = filtered.filter(c => c.status === status);
    }

    if (search) {
        filtered = filtered.filter(c =>
            (c.name || "").toLowerCase().includes(search) ||
            (c.email || "").toLowerCase().includes(search) ||
            (c.skills || "").toLowerCase().includes(search)
        );
    }

    render(filtered);
}

// =========================
// VIEW (popup later upgrade)
// =========================
function viewCandidate(id) {
    alert("Candidate ID: " + id);
}

// =========================
// AUTH HELPERS
// =========================
function getToken() {
    return localStorage.getItem("access_token");
}

function logout() {
    localStorage.removeItem("access_token");
    window.location.href = "login.html";
}

// auto load
loadCandidates();