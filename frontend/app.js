const API_BASE = "https://ai-resume-xbi6.onrender.com";


// ==============================
// BACKEND CHECK (IMPORTANT)
// ==============================
async function checkBackend() {
    try {
        const res = await fetch(`${API_BASE}/`);
        const data = await res.json();
        console.log("Backend OK:", data);
    } catch (err) {
        console.error("Backend not reachable:", err);
    }
}
checkBackend();


// ==============================
// ELEMENTS
// ==============================
const fileInput = document.getElementById("fileInput");
const uploadButton = document.getElementById("uploadButton");
const downloadButton = document.getElementById("downloadButton");

const statusBox = document.getElementById("statusBox");

const totalCard = document.getElementById("totalCard");
const parsedCard = document.getElementById("parsedCard");
const failedCard = document.getElementById("failedCard");

const resumeList = document.getElementById("resumeList");

const jdInput = document.getElementById("jdInput");
const analyzeButton = document.getElementById("analyzeButton");
const matchResults = document.getElementById("matchResults");


// ==============================
// COUNTERS
// ==============================
let uploadsCount = 0;
let parsedCount = 0;
let failedCount = 0;


// ==============================
// STATUS
// ==============================
function setStatus(message, isError = false) {
    statusBox.textContent = message;
    statusBox.className = isError ? "status error" : "status success";
}


// ==============================
// SAFE ARRAY
// ==============================
function safeArray(data) {
    return Array.isArray(data) ? data : [];
}


// ==============================
// UPDATE CARDS
// ==============================
function updateCards() {
    totalCard.textContent = `Total Uploads: ${uploadsCount}`;
    parsedCard.textContent = `Parsed: ${parsedCount}`;
    failedCard.textContent = `Failed: ${failedCount}`;
}


// ==============================
// RENDER RESUMES
// ==============================
function renderResumes(resumes) {

    resumes = safeArray(resumes);

    if (!resumes.length) {
        resumeList.innerHTML = "<p>No resumes found.</p>";
        return;
    }

    resumeList.innerHTML = resumes.map(r => `
        <div class="resume-item">
            <h3>${r.name || "Unknown Candidate"}</h3>
            <p><b>Email:</b> ${r.email || "N/A"}</p>
            <p><b>Phone:</b> ${r.phone || "N/A"}</p>
            <p><b>Skills:</b> ${r.skills || "N/A"}</p>
            <p><b>File:</b> ${r.filename || "N/A"}</p>
            ${r.ats_score !== undefined ? `<p><b>ATS Score:</b> ${r.ats_score}%</p>` : ""}
        </div>
    `).join("");
}


// ==============================
// LOAD RESUMES
// ==============================
async function loadResumes() {
    try {
        const res = await fetch(`${API_BASE}/resumes`);
        if (!res.ok) throw new Error("Failed");

        const data = await res.json();
        const resumes = data.data || [];

        uploadsCount = resumes.length;
        parsedCount = resumes.length;
        failedCount = 0;

        updateCards();
        renderResumes(resumes);

    } catch (err) {
        console.error(err);
        setStatus("Backend not reachable", true);
    }
}


// ==============================
// UPLOAD FILES
// ==============================
async function uploadFiles() {

    const files = fileInput.files;

    if (!files.length) {
        setStatus("Select files", true);
        return;
    }

    uploadButton.disabled = true;
    setStatus("Uploading...");

    let success = 0;
    let failed = 0;

    for (let file of files) {

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_BASE}/upload`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error(await res.text());
            success++;

        } catch (e) {
            failed++;
        }
    }

    uploadsCount = success + failed;
    parsedCount = success;
    failedCount = failed;

    updateCards();
    setStatus(`Uploaded ${success} files`);

    await loadResumes();

    uploadButton.disabled = false;
}


// ==============================
// DOWNLOAD EXCEL
// ==============================
async function downloadExcel() {

    downloadButton.disabled = true;
    setStatus("Generating Excel...");

    try {
        const res = await fetch(`${API_BASE}/export`);
        if (!res.ok) throw new Error();

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "resumes.xlsx";
        a.click();

        URL.revokeObjectURL(url);

        setStatus("Downloaded");

    } catch (e) {
        setStatus("Download failed", true);
    }

    downloadButton.disabled = false;
}


// ==============================
// ANALYZE JD
// ==============================
async function analyzeJobDescription() {

    const jdText = jdInput.value.trim();

    if (!jdText) {
        setStatus("Enter job description", true);
        return;
    }

    analyzeButton.disabled = true;
    setStatus("AI analyzing...");

    try {
        const res = await fetch(`${API_BASE}/analyze-jd`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_description: jdText })
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        renderMatchResults(data);

        setStatus("AI matching done");

    } catch (err) {
        console.error(err);
        setStatus("Analysis failed", true);
    }

    analyzeButton.disabled = false;
}


// ==============================
// WHY SELECTED AI
// ==============================
function generateWhySelected(candidate) {

    const matched = safeArray(candidate.matched_skills).length;
    const missing = safeArray(candidate.missing_skills).length;

    let reason = [];

    if (matched > 0) reason.push(`Matched ${matched} skills`);

    if ((candidate.ats_score || 0) > 80) reason.push("High ATS score");
    else if ((candidate.ats_score || 0) > 60) reason.push("Good match");
    else reason.push("Partial match");

    if (missing === 0) reason.push("No skill gaps");

    return reason.join(" • ");
}


// ==============================
// MATCH RESULTS
// ==============================
function renderMatchResults(data) {

    const candidates = safeArray(data.top_candidates);
    const jdSkills = safeArray(data.jd_skills);

    if (!candidates.length) {
        matchResults.innerHTML = "<p>No matches</p>";
        return;
    }

    matchResults.innerHTML = `
        <div class="jd-skills-box">
            <h2>JD Skills</h2>
            <div class="skill-tags">
                ${jdSkills.map(s => `<span class="skill-tag">${s}</span>`).join("")}
            </div>
        </div>

        <div class="candidate-grid">
            ${candidates.map((c, i) => `
                <div class="candidate-card">
                    <div class="candidate-rank">#${i + 1}</div>

                    <h2>${c.name || "Unknown"}</h2>

                    <div class="ats-score">
                        ATS: ${c.ats_score || 0}%
                    </div>

                    <p><b>Email:</b> ${c.email || "N/A"}</p>
                    <p><b>Phone:</b> ${c.phone || "N/A"}</p>
                    <p><b>File:</b> ${c.filename || "N/A"}</p>

                    <div class="why-box">
                        <b>Why Selected:</b>
                        <p>${generateWhySelected(c)}</p>
                    </div>

                    <div class="match-section">
                        <h3>Matched Skills</h3>
                        <div class="skill-tags">
                            ${safeArray(c.matched_skills).map(s => `<span class="matched-skill">${s}</span>`).join("")}
                        </div>
                    </div>

                    <div class="match-section">
                        <h3>Missing Skills</h3>
                        <div class="skill-tags">
                            ${safeArray(c.missing_skills).map(s => `<span class="missing-skill">${s}</span>`).join("")}
                        </div>
                    </div>

                </div>
            `).join("")}
        </div>
    `;
}


// ==============================
// EVENTS
// ==============================
uploadButton.addEventListener("click", uploadFiles);
downloadButton.addEventListener("click", downloadExcel);
analyzeButton.addEventListener("click", analyzeJobDescription);

fileInput.addEventListener("change", () =>
    setStatus("Files selected")
);


// ==============================
// INIT
// ==============================
loadResumes();