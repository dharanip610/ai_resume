
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
            <td>
                <span class="score">
                    ${c.ats_score || 0}%
                </span>
            </td>

            <td>
                <span class="badge ${(c.status || "New").replace(/\s+/g, "")}">
                    ${c.status || "New"}
                </span>
            </td>

            <td>
                <button
                    class="view-btn"
                    onclick="viewCandidate('${c.id}')">
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


    let filtered = [...allCandidates];

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
                (c.passout_year || "")
                .toString()
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

(c.location || "")
    .toLowerCase()
    .includes(search)

||

(c.passout_year || "")
    .toString()
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

    // LOCATION FILTER

    if (location) {

        filtered = filtered.filter(c =>

            (c.location || "")
                .toLowerCase()
                .includes(location)
        );
    }

    // PASSOUT YEAR FILTER

    if (year) {

        filtered = filtered.filter(c =>

            String(
                c.passout_year || ""
            )
            .toLowerCase()
            .includes(year)
        );
    }

    // EXPERIENCE FILTER

    if (experience) {

        filtered = filtered.filter(c =>

            (c.experience_details || "")
                .toLowerCase()
                .includes(experience)
        );
    }

    // GLOBAL SEARCH

    if (search) {

        filtered = filtered.filter(c =>

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

            String(
                c.passout_year || ""
            )
            .toLowerCase()
            .includes(search)
        );
    }

    render(filtered);
}

// =========================
// VIEW CANDIDATE
// =========================
function viewCandidate(id) {

    const candidate = allCandidates.find(
        c => c.id === id
    );

    if (!candidate) return;

    selectedCandidateId = candidate.id;

    document.getElementById("modalBody").innerHTML = `

        <div class="detail-row">
            <span class="detail-label">Name:</span>
            ${candidate.name || "-"}
        </div>

        <div class="detail-row">
            <span class="detail-label">Email:</span>
            ${candidate.email || "-"}
        </div>

        <div class="detail-row">
            <span class="detail-label">Phone:</span>
            ${candidate.phone || "-"}
        </div>

        <div class="detail-row">
            <span class="detail-label">Location:</span>
            ${candidate.location || "-"}
        </div>

        <div class="detail-row">
            <span class="detail-label">College:</span>
            ${candidate.college_name || "-"}
        </div>

        <div class="detail-row">
            <span class="detail-label">Passout Year:</span>
            ${candidate.passout_year || "-"}
        </div>

        <div class="detail-row">
            <span class="detail-label">Skills:</span>
            ${candidate.skills || "-"}
        </div>

        <div class="detail-row">
            <span class="detail-label">ATS Score:</span>
            ${candidate.ats_score || 0}%
        </div>

        <hr>

        <label>Status</label>

        <select
            id="candidateStatus"
            style="width:100%;padding:8px;margin-top:5px;">

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
            style="width:100%;">

        </textarea>

        <br><br>

        <label>Internal Notes</label>

        <textarea
            id="candidateNotes"
            rows="3"
            style="width:100%;">

        </textarea>

        <br><br>

        <label>Follow Up Date</label>

        <input
            type="date"
            id="candidateFollowUp"
            style="width:100%;padding:8px;">

        <br><br>

        <div style="text-align:center;">

            <button
                class="view-btn"
                onclick="downloadResume('${candidate.resume_url || ""}')">

                 Download Resume

            </button>

            <button
                class="view-btn"
                onclick="saveCandidate()">

                 Save Changes

            </button>

        </div>
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
            candidate.follow_up_date || "";

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

            follow_up_date:
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
