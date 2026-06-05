const API_BASE = "https://ai-resume-xbi6.onrender.com";

let candidates = [];

// ===============================
// LOAD DASHBOARD DATA
// ===============================
async function loadDashboard() {

    try {

        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Login required");
            return;
        }

        const res = await fetch(`${API_BASE}/resumes`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("API ERROR:", data);
            alert("Dashboard load failed");
            return;
        }

        candidates = data.data || [];

        updateDashboard();

    } catch (err) {
        console.error("FETCH ERROR:", err);
        alert("Dashboard load failed");
    }
}

// ===============================
// CALCULATE METRICS
// ===============================
function updateDashboard() {

    const total = candidates.length;

    const newCount = candidates.filter(c =>
        !c.status || c.status.toLowerCase() === "new"
    ).length;

    const selected = candidates.filter(c =>
        c.status && c.status.toLowerCase() === "selected"
    ).length;

    const rejected = candidates.filter(c =>
        c.status && c.status.toLowerCase() === "rejected"
    ).length;

    // UPDATE UI
    document.getElementById("totalResumes").innerText = total;
    document.getElementById("newCandidates").innerText = newCount;
    document.getElementById("selectedCount").innerText = selected;
    document.getElementById("rejectedCount").innerText = rejected;
}

// INIT
loadDashboard();