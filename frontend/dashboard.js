const API_BASE = "https://127.0.0.1:8000";

let candidates = [];

// ===============================
// LOAD DASHBOARD DATA
// ===============================
async function loadDashboard() {

    try {

        const token =
            localStorage.getItem("access_token");

        const res = await fetch(
            `${API_BASE}/dashboard`,
            {
                headers: {
                    Authorization:
                        "Bearer " + token
                }
            }
        );

        const result =
            await res.json();

        console.log(result);

        const stats =
            result.data;

        document.getElementById(
            "totalResumes"
        ).innerText =
            stats.total_candidates || 0;

        document.getElementById(
            "newCandidates"
        ).innerText =
            stats.new_candidates || 0;

        document.getElementById(
            "selectedCount"
        ).innerText =
            stats.selected || 0;

        document.getElementById(
            "rejectedCount"
        ).innerText =
            stats.rejected || 0;

        document.getElementById(
            "avgScore"
        ).innerText =
            (stats.average_ats_score || 0) + "%";

        document.getElementById(
            "analyzedCount"
        ).innerText =
            stats.candidates_analyzed || 0;

        document.getElementById(
            "followupCount"
        ).innerText =
            stats.followups_due || 0;

    } catch (err) {

        console.error(err);

        alert(
            "Dashboard load failed"
        );
    }
}
// ===============================
// CALCULATE METRICS
// ===============================
function updateDashboard() {

    const total =
        candidates.length;

    const newCount =
        candidates.filter(
            c =>
                !c.status ||
                c.status.toLowerCase() ===
                "new"
        ).length;

    const selected =
        candidates.filter(
            c =>
                c.status &&
                c.status.toLowerCase() ===
                "selected"
        ).length;

    const rejected =
        candidates.filter(
            c =>
                c.status &&
                c.status.toLowerCase() ===
                "rejected"
        ).length;

    const avgScore =
        total > 0
            ? Math.round(
                candidates.reduce(
                    (sum, c) =>
                        sum + (c.ats_score || 0),
                    0
                ) / total
            )
            : 0;

    const analyzedCount =
        candidates.filter(
            c => (c.ats_score || 0) > 0
        ).length;

    const followupCount =
        candidates.filter(
            c => c.followup_date
        ).length;

    document.getElementById(
        "totalResumes"
    ).innerText = total;

    document.getElementById(
        "newCandidates"
    ).innerText = newCount;

    document.getElementById(
        "selectedCount"
    ).innerText = selected;

    document.getElementById(
        "rejectedCount"
    ).innerText = rejected;

    document.getElementById(
        "avgScore"
    ).innerText =
        avgScore + "%";

    document.getElementById(
        "analyzedCount"
    ).innerText =
        analyzedCount;

    document.getElementById(
        "followupCount"
    ).innerText =
        followupCount;
}
// ===============================
// LOGOUT
// ===============================
function logout() {

    localStorage.removeItem(
        "access_token"
    );

    window.location.href =
        "login.html";
}

// ===============================
// INIT
// ===============================
document.addEventListener(
    "DOMContentLoaded",
    loadDashboard
);