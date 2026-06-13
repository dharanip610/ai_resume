
// =========================
// API
// =========================
const API_BASE = "http://127.0.0.1:8000";

// =========================
// GLOBAL DATA
// =========================

let allCandidates = [];
let selectedCandidateId = null;

// =========================
// LOAD CANDIDATES
// =========================

async function loadCandidates() {

    try {

        const token = getToken();

        const res = await fetch(`${API_BASE}/resumes`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        console.log("CANDIDATES:", data);

        allCandidates = data.data || [];

        render(allCandidates);

    } catch (err) {

        console.error("LOAD ERROR:", err);

        alert("Failed to load candidates");
    }
}

// =========================
// RENDER TABLE
// =========================

function render(data) {

    let html = "";

    if (!data.length) {

        html = `
        <tr>
            <td colspan="10">
                No candidates found
            </td>
        </tr>
        `;

        document.getElementById("candidateTable").innerHTML = html;

        return;
    }

    data.forEach(c => {

    html += `
    <tr>

        <td>${c.name || "-"}</td>

        <td>${c.email || "-"}</td>

        <td>${c.phone || "-"}</td>

        <td>${c.location || "-"}</td>

        <td>${c.passout_year || "-"}</td>

        <td>${c.college_name || "-"}</td>
        <td>${c.skills || "-"}</td>

        <td>
            <span class="score">
                ${c.ats_score || 0}%
            </span>
        </td>

        <td style="text-align:center;">
            <span class="badge ${(c.status || "New").replace(/\s+/g, "")}">
                ${c.status || "New"}
            </span>
        </td>

        <td style="text-align:center;">

            <div class="action-buttons">

                <button
                    class="view-btn"
                    onclick="viewCandidate('${c.id}')">
                    View
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteCandidate('${c.id}')">
                    Delete
                </button>

            </div>

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

    let filtered = [...allCandidates];

    const search =
        document.getElementById("searchInput")
        ?.value.toLowerCase() || "";

    const status =
        document.getElementById("statusFilter")
        ?.value || "";

    const location =
        document.getElementById("locationFilter")
        ?.value.toLowerCase() || "";

    const year =
        document.getElementById("yearFilter")
        ?.value.toLowerCase() || "";

    const experience =
        document.getElementById("experienceFilter")
        ?.value.toLowerCase() || "";

    const internship =
        document.getElementById("internshipFilter")
        ?.value.toLowerCase() || "";

    const certification =
        document.getElementById("certificationFilter")
        ?.value.toLowerCase() || "";

    // STATUS FILTER
    if (status) {

        filtered = filtered.filter(
            c => c.status === status
        );
    }

    // LOCATION FILTER
    if (location) {

        filtered = filtered.filter(
            c =>
                (c.location || "")
                .toLowerCase()
                .includes(location)
        );
    }

    // PASSOUT YEAR FILTER
    if (year) {

        filtered = filtered.filter(
            c =>
                String(c.passout_year || "")
                .toLowerCase()
                .includes(year)
        );
    }

    // EXPERIENCE FILTER
    if (experience) {

        filtered = filtered.filter(
            c =>
                (c.experience_details || "")
                .toLowerCase()
                .includes(experience)
        );
    }

    // INTERNSHIP FILTER
    if (internship) {

        filtered = filtered.filter(
            c =>
                (c.internship_details || "")
                .toLowerCase()
                .includes(internship)
        );
    }

    // CERTIFICATION FILTER
    if (certification) {

        filtered = filtered.filter(
            c =>
                (c.certification_details || "")
                .toLowerCase()
                .includes(certification)
        );
    }

    // GLOBAL SEARCH
    if (search) {

        filtered = filtered.filter(
            c =>

                (c.name || "")
                .toLowerCase()
                .includes(search)

                ||

                (c.email || "")
                .toLowerCase()
                .includes(search)

                ||

                (c.skills || "")
                .toLowerCase()
                .includes(search)

                ||

                (c.college_name || "")
                .toLowerCase()
                .includes(search)

                ||

                (c.phone || "")
                .toLowerCase()
                .includes(search)

                ||

                (c.location || "")
                .toLowerCase()
                .includes(search)

                ||

                (c.experience_details || "")
                .toLowerCase()
                .includes(search)

                ||

                (c.internship_details || "")
                .toLowerCase()
                .includes(search)

                ||

                (c.certification_details || "")
                .toLowerCase()
                .includes(search)

                ||

                String(c.passout_year || "")
                .toLowerCase()
                .includes(search)
        );
    }

    renderCandidates(filtered);
}
// =========================
// VIEW CANDIDATE
// =========================
/*function viewCandidate(id){

    const candidate =
        allCandidates.find(
            c => c.id === id
        );

    if(!candidate){

        alert("Candidate not found");
        return;
    }

    document.getElementById(
        "modalBody"
    ).innerHTML = `

    <div class="detail-row">
        <strong>Name:</strong>
        ${candidate.name || "-"}
    </div>

    <div class="detail-row">
        <strong>Email:</strong>
        ${candidate.email || "-"}
    </div>

    <div class="detail-row">
        <strong>Phone:</strong>
        ${candidate.phone || "-"}
    </div>

    <div class="detail-row">
        <strong>Location:</strong>
        ${candidate.location || "-"}
    </div>

    <div class="detail-row">
        <strong>College:</strong>
        ${candidate.college_name || "-"}
    </div>

    <div class="detail-row">
        <strong>Passout Year:</strong>
        ${candidate.passout_year || "-"}
    </div>

    <div class="detail-row">
        <strong>Skills:</strong>
        ${candidate.skills || "-"}
    </div>

    <div class="detail-row">
        <strong>ATS Score:</strong>
        ${candidate.ats_score || 0}%
    </div>

    <hr>

    <label>Status</label>

    <select id="candidateStatus">

        <option value="New">New</option>
        <option value="Contacted">Contacted</option>
        <option value="Interview Scheduled">Interview Scheduled</option>
        <option value="Selected">Selected</option>
        <option value="Rejected">Rejected</option>
        <option value="On Hold">On Hold</option>

    </select>

    <br><br>

    <label>Remarks</label>

    <textarea
        id="candidateRemarks"
        rows="3"
    >${candidate.remarks || ""}</textarea>

    <br><br>

    <label>Internal Notes</label>

    <textarea
        id="candidateNotes"
        rows="4"
    >${candidate.notes || ""}</textarea>

    <br><br>

    <label>Follow Up Date</label>

    <input
        type="date"
        id="candidateFollowUp"
        value="${candidate.followup_date || ""}"
    >

    <br><br>

    <button
        onclick="downloadResume('${candidate.resume_url || ""}')"
    >
        Download Resume
    </button>

    <button>
        Save Changes
    </button>

    `;
    document.getElementById(
        "candidateModal"
    ).style.display = "block";

    setTimeout(() => {

        document.getElementById(
            "candidateStatus"
        ).value =
            candidate.status || "New";

        document.getElementById(
            "candidateRemarks"
        ).value =
            candidate.remarks || "";

        document.getElementById(
            "candidateNotes"
        ).value =
            candidate.internal_notes || "";

        document.getElementById(
            "candidateFollowUp"
        ).value =
            candidate.followup_date || "";

    }, 50);
}
// =========================
// CLOSE MODAL
// =========================

function closeModal() {

    document.getElementById(
        "candidateModal"
    ).style.display = "none";
}

// =========================
// DOWNLOAD RESUME
// =========================

function downloadResume(path) {

    if (!path) {

        alert("Resume not found");

        return;
    }

    window.open(
        `${API_BASE}/download?path=${encodeURIComponent(path)}`,
        "_blank"
    );
}
// =========================
// SAVE CANDIDATE
// =========================

async function saveCandidate() {

    try {

        const token = getToken();

        const payload = {

            status:
                document.getElementById(
                    "candidateStatus"
                ).value,

            remarks:
                document.getElementById(
                    "candidateRemarks"
                ).value,

            internal_notes:
                document.getElementById(
                    "candidateNotes"
                ).value,

            followup_date:
                document.getElementById(
                    "candidateFollowUp"
                ).value || null
        };

        const res = await fetch(

            `${API_BASE}/candidate/${selectedCandidateId}`,

            {
                method: "PUT",

                headers: {
                    "Authorization":
                        "Bearer " + token,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(payload)
            }
        );

        const data = await res.json();

        console.log("UPDATE:", data);

        if (data.status === "success") {

            alert(
                "Candidate updated successfully"
            );

            closeModal();

            loadCandidates();

        } else {

            alert(
                data.error ||
                "Update failed"
            );
        }

    } catch (err) {

        console.error(
            "SAVE ERROR:",
            err
        );

        alert(
            "Update failed"
        );
    }
}
// =========================
// EXPORT EXCEL
// =========================

function exportExcel() {

    window.open(
        `${API_BASE}/export/excel`,
        "_blank"
    );
}

// =========================
// EXPORT CSV
// =========================

function exportCSV() {

    window.open(
        `${API_BASE}/export/csv`,
        "_blank"
    );
}

// =========================
// AUTH HELPERS
// =========================

function getToken() {

    return localStorage.getItem(
        "access_token"
    );
}

function logout() {

    localStorage.removeItem(
        "access_token"
    );

    window.location.href =
        "login.html";
}

// =========================
// EVENTS
// =========================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadCandidates();

        document
            .getElementById("searchInput")
            ?.addEventListener(
                "input",
                filterData
            );

        document
            .getElementById("statusFilter")
            ?.addEventListener(
                "change",
                filterData
            );

        document
            .getElementById("locationFilter")
            ?.addEventListener(
                "input",
                filterData
            );

        document
            .getElementById("yearFilter")
            ?.addEventListener(
                "input",
                filterData
            );

        document
            .getElementById("experienceFilter")
            ?.addEventListener(
                "input",
                filterData
            );

        document
            .getElementById("internshipFilter")
            ?.addEventListener(
                "input",
                filterData
            );

        document
            .getElementById("certificationFilter")
            ?.addEventListener(
                "input",
                filterData
            );
    }
);
async function deleteCandidate(candidateId) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this candidate?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const token =
            localStorage.getItem(
                "access_token"
            );

        const res = await fetch(

            `${API_BASE}/candidate/${candidateId}`,

            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        const data =
            await res.json();

        if (
            data.status === "success"
        ) {

            alert(
                "Candidate deleted successfully"
            );

            loadCandidates();

        } else {

            alert(
                data.error ||
                "Delete failed"
            );
        }

    } catch (err) {

        console.error(err);

        alert(
            "Delete failed"
        );
    }
}