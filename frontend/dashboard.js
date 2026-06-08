const API_BASE = "https://ai-resume-xbi6.onrender.com";

let candidates = [];

// ===============================
// LOAD DASHBOARD DATA
// ===============================
async function loadDashboard() {

    try {

        const token = localStorage.getItem(
            "access_token"
        );

        console.log(
            "TOKEN =",
            token
        );

        if (!token) {

            alert("Login required");

            window.location.href =
                "login.html";

            return;
        }

        const res = await fetch(
            `${API_BASE}/resumes`,
            {
                method: "GET",
                headers: {
                    "Authorization":
                        "Bearer " + token,
                    "Content-Type":
                        "application/json"
                }
            }
        );

        const data = await res.json();

        console.log(
            "STATUS =",
            res.status
        );

        console.log(
            "RESPONSE =",
            data
        );

        if (!res.ok) {

            console.error(
                "API ERROR =",
                data
            );

            alert(
                "Dashboard load failed"
            );

            return;
        }

        candidates =
            data.data || [];

        updateDashboard();

    } catch (err) {

        console.error(
            "FETCH ERROR =",
            err
        );

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