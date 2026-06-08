const API_BASE = "https://ai-resume-xbi6.onrender.com";

async function analyzeJD() {


try {

    const jd = document
        .getElementById("jobDescription")
        .value
        .trim();

    if (!jd) {
        alert("Enter Job Description");
        return;
    }

    const token =
        localStorage.getItem(
            "access_token"
        );

    console.log("TOKEN:", token);

    const res = await fetch(
        `${API_BASE}/analyze-jd`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
                "Authorization":
                    "Bearer " + token
            },
            body: JSON.stringify({
                job_description: jd
            })
        }
    );

    const data = await res.json();

    console.log("STATUS:", res.status);
    console.log(JSON.stringify(data, null, 2));

    const tbody =
        document.getElementById(
            "resultsBody"
        );

    tbody.innerHTML = "";

    if (
        !data.data ||
        data.data.length === 0
    ) {

       tbody.innerHTML = `
    <tr>
        <td colspan="4">
            No Results Found
        </td>
    </tr>
`;

        return;
    }

    data.data.forEach(c => {

        tbody.innerHTML += `
            <tr>
                <td>${c.name || "-"}</td>
                <td>${c.email || "-"}</td>
                <td>${c.skills || "-"}</td>
                <td>${c.score || 0}%</td>
            </tr>
        `;
    });

} catch (err) {

    console.error(err);

    alert(
        "JD Analysis Failed"
    );
}


}

function logout() {


localStorage.removeItem(
    "access_token"
);

window.location.href =
    "login.html";


}

