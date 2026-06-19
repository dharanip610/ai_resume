const API_BASE = "https://ai-resume-xbi6.onrender.com";

let allCandidates = [];
let currentSearch = "";
let selectedCandidateId = null;

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
document
.getElementById("searchInput")
.addEventListener("input", function () {

    currentSearch =
        this.value.toLowerCase();

    const filtered =
        allCandidates.filter(c =>

            (c.name || "")
            .toLowerCase()
            .includes(currentSearch)

            ||

            (c.email || "")
            .toLowerCase()
            .includes(currentSearch)

            ||

            (c.phone || "")
            .toLowerCase()
            .includes(currentSearch)
        );

    renderCandidates(filtered);
});
renderCandidates(filtered);
function resetFilters() {

    document.getElementById("nameFilter").value = "";
    document.getElementById("emailFilter").value = "";
    document.getElementById("phoneFilter").value = "";
    document.getElementById("statusFilter").value = "";

    renderCandidates(allCandidates);
}
closeFilterPanel();

// ===============================
// RENDER TABLE
// ===============================
function renderCandidates(list) {

    const table =
        document.getElementById(
            "candidateTable"
        );

    if (!list.length) {

        table.innerHTML = `
        <tr>
            <td colspan="6">
                No candidates found
            </td>
        </tr>
        `;

        return;
    }

    table.innerHTML = list.map(c => `

        <tr class="${
            currentSearch
                ? 'highlight-row'
                : ''
        }">

            <td class="candidate-name">
    ${c.name || "N/A"}
</td>

            <td>
                ${c.email || "N/A"}
            </td>

            <td>
                ${c.phone || "N/A"}
            </td>

            <td>
                <span class="score">
                    ${c.ats_score || 0}%
                </span>
            </td>

            <td>
                <span class="badge">
                    ${c.status || "New"}
                </span>
            </td>

            <td>

                <div class="action-buttons">

                    <button
                        class="view-btn"
                        onclick="viewCandidate('${c.id}')">
                        View
                    </button>
                    <button
    class="contact-btn"
    onclick="contactCandidate('${c.id}')">

    Contact

</button>

                    <button
                        class="delete-btn"
                        onclick="deleteCandidate('${c.id}')">
                        Delete
                    </button>

                </div>

            </td>

        </tr>

    `).join("");
}
// ===============================
// STATUS UPDATE
// ===============================
async function saveNotes(id) {

    const notes =
        document.getElementById(
            `notes-${id}`
        ).value;

    const followup_date =
        document.getElementById(
            `followup-${id}`
        ).value;

    try {

        const res = await fetch(
            `${API_BASE}/candidate-notes`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    id,
                    notes,
                    followup_date
                })
            }
        );

        const data = await res.json();

        alert("Notes Saved");

    } catch (err) {

        console.error(err);

        alert("Save Failed");
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

    const nameValue =
        document.getElementById("nameFilter")
        ?.value.toLowerCase() || "";

    const emailValue =
        document.getElementById("emailFilter")
        ?.value.toLowerCase() || "";

    const phoneValue =
        document.getElementById("phoneFilter")
        ?.value.toLowerCase() || "";

    const statusValue =
        document.getElementById("statusFilter")
        ?.value || "";

    let filtered =
        [...allCandidates];

    if (nameValue) {

        filtered = filtered.filter(c =>
            (c.name || "")
            .toLowerCase()
            .includes(nameValue)
        );
    }

    if (emailValue) {

        filtered = filtered.filter(c =>
            (c.email || "")
            .toLowerCase()
            .includes(emailValue)
        );
    }

    if (phoneValue) {

        filtered = filtered.filter(c =>
            (c.phone || "")
            .toString()
            .toLowerCase()
            .includes(phoneValue)
        );
    }

    if (statusValue) {

        filtered = filtered.filter(c =>
            c.status === statusValue
        );
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
function viewCandidate(id){

    const candidate =
        allCandidates.find(
            c => c.id === id
        );
       selectedCandidateId =
    candidate.id;
    if(!candidate){

        alert("Candidate not found");
        return;
    }
       selectedCandidateId = candidate.id;
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
<button
    onclick="saveCandidate()"
>
    Save Changes
</button>

    `;

    document.getElementById(
        "candidateModal"
    ).style.display = "block";
}
 function downloadResume(url){

    if(!url){

        alert("Resume not found");

        return;
    }

    const link =
        document.createElement("a");

    link.href = url;

    link.target = "_blank";

    link.click();
}

function closeModal(){

    document
    .getElementById(
        "candidateModal"
    ).style.display =
    "none";

}
function openFilterPanel(){

    const panel =
        document.getElementById(
            "filterPanel"
        );

    if(panel){

        panel.style.right = "0";

    }

}

function closeFilterPanel(){

    const panel =
        document.getElementById(
            "filterPanel"
        );

    if(panel){

        panel.style.right = "-420px";

    }

}
// ===============================
// DELETE CANDIDATE
// ===============================
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
// =========================
// EXPORT EXCEL
// =========================

async function exportExcel() {

    const token =
        localStorage.getItem(
            "access_token"
        );

    const response = await fetch(
        `${API_BASE}/export/excel`,
        {
            headers: {
                Authorization:
                    "Bearer " + token
            }
        }
    );

    if (!response.ok) {
        alert("Export failed");
        return;
    }

    const blob =
        await response.blob();

    const url =
        window.URL.createObjectURL(
            blob
        );

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        "candidates.xlsx";

    document.body.appendChild(a);

    a.click();

    a.remove();
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
// SAVE CANDIDATE
// =========================

async function saveCandidate() {

    try {

       const token =
    localStorage.getItem(
        "access_token"
    );

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
function contactCandidate(id){

    const candidate =
        allCandidates.find(
            c => c.id === id
        );

    if(!candidate){

        alert("Candidate not found");
        return;

    }

    const phone =
        candidate.phone || "";

    const email =
        candidate.email || "";

    const whatsappUrl =
        `https://wa.me/91${phone}`;

    const mailUrl =
        `mailto:${email}`;

    document.getElementById("modalBody").innerHTML = `

<div class="contact-popup">

    <h2> Contact Candidate</h2>

    <div class="contact-card">

        <p><strong>Name</strong></p>
        <span>${candidate.name}</span>

        <p><strong>Phone</strong></p>
        <span>${phone}</span>

        <p><strong>Email</strong></p>
        <span>${email}</span>

    </div>

    <div class="contact-actions">

        <a
            href="${whatsappUrl}"
            target="_blank"
            class="whatsapp-btn">

            📱 WhatsApp

        </a>

        <a
            href="${mailUrl}"
            class="email-btn">

            ✉ Email

        </a>

    </div>

</div>

`;
    document.getElementById(
        "candidateModal"
    ).style.display =
    "block";

}