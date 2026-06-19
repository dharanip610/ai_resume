console.log("UPLOAD JS LOADED");

window.uploadResume = async function () {

    console.log("BUTTON CLICKED");

    const fileInput = document.getElementById("resumeFile");
    const status = document.getElementById("uploadStatus");

    // check input exists
    if (!fileInput) {
        console.error("resumeFile not found");
        return;
    }

    // check file selected
    if (fileInput.files.length === 0) {
        status.innerText = "Please select a file";
        status.style.color = "red";
        return;
    }

    const file = fileInput.files[0];

    // UI loading state
    status.innerText = "Uploading...";
    status.style.color = "blue";

    // token (support both keys)
    const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

    if (!token) {
        status.innerText = "Login required ❌";
        status.style.color = "red";
        return;
    }

    try {

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("https://ai-resume-xbi6.onrender.com/upload", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token
            },
            body: formData
        });

        // safe response read
        const text = await res.text();
        console.log("SERVER RESPONSE:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { raw: text };
        }

        // error handling
        if (!res.ok) {
            throw new Error(data.detail || "Upload failed");
        }

        // success UI
        status.innerText = "Resume uploaded successfully ✅";
        status.style.color = "green";

        console.log("UPLOAD SUCCESS:", data);

        // reset input
        fileInput.value = "";

    } catch (err) {
        console.error("UPLOAD ERROR:", err);
        status.innerText = "Upload failed ❌";
        status.style.color = "red";
    }
};