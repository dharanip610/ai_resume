const API_BASE = "http://127.0.0.1:8000";

let allCandidates = [];

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    loadCandidates();
    setupFilters();
});


// ===============================
// LOAD CANDIDATES
// ===============================
async function loadCandidates() {

    try {

        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please login first");
            window.location.href = "login.html";
            return;
        }

        const res = await fetch(`${API_BASE}/resumes`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        console.log("API DATA:", data);

        allCandidates = data.data || [];

        renderCandidates(allCandidates);

    } catch (err) {

        console.error("Load failed:", err);

        alert("Failed to load candidates");
    }
}


// ===============================
// RENDER TABLE
// ===============================
function renderCandidates(list) {

    const table = document.getElementById("candidateTable");

    if (!list.length) {
        table.innerHTML = `<tr><td colspan="6">No candidates found</td></tr>`;
        return;
    }

    table.innerHTML = list.map(c => `
        <tr>

            <td>${c.name || "N/A"}</td>
            <td>${c.email || "N/A"}</td>
            <td>${c.college_name || "N/A"}</td>
            <td>${c.skills || "N/A"}</td>

            <td>
                <span class="status-badge ${formatStatus(c.status)}">
                    ${c.status || "New"}
                </span>
            </td>

            <td>
                <button onclick="updateStatus('${c.id}', 'Selected')">✔</button>
                <button onclick="updateStatus('${c.id}', 'Rejected')">✖</button>
                <button onclick="updateStatus('${c.id}', 'On Hold')">⏸</button>
            </td>

        </tr>
    `).join("");
}


// ===============================
// STATUS UPDATE
// ===============================
async function updateStatus(id, status) {

    try {

        const res = await fetch(`${API_BASE}/candidate-status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id, status })
        });

        if (!res.ok) throw new Error("Update failed");

        loadCandidates();

    } catch (err) {
        console.error(err);
        alert("Status update failed");
    }
}


// ===============================
// FILTER SYSTEM SETUP
// ===============================
function setupFilters() {

    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");

    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", applyFilters);
    }
}


// ===============================
// APPLY FILTERS (SEARCH + STATUS)
// ===============================
function applyFilters() {

    const searchValue = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const statusValue = document.getElementById("statusFilter")?.value || "";

    let filtered = [...allCandidates];

    // SEARCH FILTER
    if (searchValue) {
        filtered = filtered.filter(c =>
            (c.name || "").toLowerCase().includes(searchValue) ||
            (c.email || "").toLowerCase().includes(searchValue) ||
            (c.skills || "").toLowerCase().includes(searchValue)
        );
    }

    // STATUS FILTER
    if (statusValue) {
        filtered = filtered.filter(c => c.status === statusValue);
    }

    renderCandidates(filtered);
}


// ===============================
// STATUS FORMAT (FIXED)
// ===============================
function formatStatus(status) {

    if (!status) return "new";

    return status
        .toLowerCase()
        .replace(/\s+/g, "-");   // FIX: multiple spaces issue
}