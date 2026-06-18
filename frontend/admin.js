const API_BASE = "http://127.0.0.1:8000";

// ===============================
// LOAD ADMIN DATA
// ===============================
async function loadAdminData() {

    try {

        const token =
localStorage.getItem(
    "access_token"
);

console.log(
    "TOKEN =",
    token
);

const res = await fetch(
    `${API_BASE}/admin/stats`,
    {
        headers: {
            "Authorization":
                "Bearer " + token
        }
    }
);

        const data = await res.json();

        document.getElementById("hrCount").innerText = data.hr_count || 0;
        document.getElementById("resumeCount").innerText = data.resume_count || 0;
        document.getElementById("activeCount").innerText = data.active_count || 0;
        document.getElementById("pendingOnboarding").innerText =
        data.pending_onboarding || 0;
        document.getElementById("pendingDemo").innerText =
        data.pending_demo || 0;
    } catch (err) {
        console.error(err);
    }

    loadHRUsers();
}

// ===============================
// LOAD HR USERS
// ===============================
async function loadHRUsers() {

    try {

       const token =
    localStorage.getItem(
        "access_token"
    );

const res = await fetch(
    `${API_BASE}/admin/hr-users`,
    {
        headers: {
            "Authorization":
                "Bearer " + token
        }
    }
);
        const data = await res.json();

        const users = data.data || [];

        const table = document.getElementById("hrTable");
        const today = new Date();

        table.innerHTML = users.map(u => {
            let status = "Active";

            if (
                u.subscription_status === "trial" &&
                u.trial_end_date
            ) {
                const trialDate = new Date(u.trial_end_date);

                if (today > trialDate) {
                    status = "Trial Expired";
                } else {
                    status = "Trial Active";
                }
            }

            return `
    <tr>
        <td>${u.email}</td>

        <td>${u.role || "HR"}</td>

        <td>
<span class="subscription-badge">
${u.subscription_status || "trial"}
</span>
</td>

        <td>
            ${u.trial_end_date || "-"}
        </td>

        <td>
            ${status}
        </td>

       <td>

    <button
       class="view-btn"
       onclick="viewHR('${u.id}')">
       View
    </button>

    <button
       class="excel-btn"
       onclick="downloadExcel('${u.id}')">
       Excel
    </button>

    <button
       class="delete-btn"
       onclick="deleteHR('${u.id}')">
       Delete
    </button>

</td>

    </tr>`;
       }).join("");

    } 
    catch (err) {
        console.error(err);
    }
}

// ===============================
// CREATE HR USER
// ===============================
async function createHR() {

    const email = document.getElementById("hrEmail").value;
    const password = document.getElementById("hrPassword").value;
    const msg = document.getElementById("adminMsg");

    if (!email || !password) {
        msg.innerText = "Enter details";
        msg.style.color = "red";
        return;
    }

    try {

        const res = await fetch(`${API_BASE}/admin/create-hr`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) throw new Error();

        msg.innerText = "HR created successfully";
        msg.style.color = "green";

        loadHRUsers();

    } catch (err) {
        msg.innerText = "Failed to create HR";
        msg.style.color = "red";
    }
}

// ===============================
// DELETE HR USER
// ===============================
async function deleteHR(id) {

    try {

        await fetch(`${API_BASE}/admin/delete-hr`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });

        loadHRUsers();

    } catch (err) {
        alert("Delete failed");
    }
}// ===============================
// VIEW HR DETAILS
// ===============================

async function viewHR(id){

try{

const token =
localStorage.getItem(
"access_token"
);

const res = await fetch(
`${API_BASE}/admin/hr-users`,
{
headers:{
Authorization:
"Bearer " + token
}
}
);

const data =
await res.json();
console.log(data);
console.log(id);
const hr =
(data.data || [])
.find(
x => x.id === id
);

console.log("FOUND HR =", hr);

if(!hr){
alert("HR Not Found");
return;
}
console.log(
    document.getElementById(
        "hrDetails"
    )
);
document
.getElementById(
"hrDetails"
).innerHTML = `

<h3>HR Management</h3>

<hr>

<p>
<b>Email:</b>
${hr.email}
</p>

<p>
<b>Role:</b>
${hr.role || "HR"}
</p>

<p>
<b>Subscription:</b>
${hr.subscription_status || "trial"}
</p>

<p>
<b>Trial End:</b>
${hr.trial_end_date || "-"}
</p>

<p>
<b>Status:</b>
${hr.status || "Active"}
</p>

<hr>

<button
class="view-btn"
onclick="extendTrial('${hr.id}')">

Extend Trial

<button
class="view-btn"
onclick="activatePlan('${hr.id}')">

Activate Plan

</button>

<button
class="delete-btn"
onclick="suspendUser('${hr.id}')">

Suspend User

</button>
<button
class="view-btn"
onclick="activateUser('${hr.id}')">

Activate User

</button>

`;

document
.getElementById(
"hrModal"
).style.display =
"block";

}catch(err){

console.error(err);

alert(
"Failed to load HR details"
);

}

}

// ===============================
// CLOSE MODAL
// ===============================

function closeModal(){

document
.getElementById(
"hrModal"
).style.display =
"none";

}
async function downloadExcel(hrId){

    try{

        const token =
            localStorage.getItem(
                "access_token"
            );

        const response =
            await fetch(
                `${API_BASE}/admin/export-hr-candidates/${hrId}`,
                {
                    headers:{
                        Authorization:
                            "Bearer " + token
                    }
                }
            );

        const blob =
            await response.blob();

        const url =
            window.URL.createObjectURL(
                blob
            );

        const a =
            document.createElement(
                "a"
            );

        a.href = url;

        a.download =
            "candidates.xlsx";

        a.click();

    }
    catch(err){

        console.error(err);

        alert(
            "Download Failed"
        );

    }

}
async function extendTrial(hrId){

    try{

        const token =
        localStorage.getItem(
            "access_token"
        );

        const res =
        await fetch(
            `${API_BASE}/admin/extend-trial/${hrId}`,
            {
                method:"POST",
                headers:{
                    Authorization:
                    "Bearer " + token
                }
            }
        );

        const data =
        await res.json();

        alert(
            "Trial Extended Successfully"
        );

        loadHRUsers();

    }
    catch(err){

        console.error(err);

        alert(
            "Failed"
        );

    }

}
async function activatePlan(hrId){


    try{

        const token =
        localStorage.getItem(
            "access_token"
        );

        await fetch(
            `${API_BASE}/admin/activate-plan/${hrId}`,
            {
                method:"POST",
                headers:{
                    Authorization:
                    "Bearer " + token
                }
            }
        );

        alert(
            "Plan Activated Successfully"
        );

        loadAdminData();

    }
    catch(err){

        console.error(err);

        alert(
            "Failed"
        );

    }

}
async function suspendUser(hrId){

    const ok =
    confirm(
        "Suspend this HR?"
    );

    if(!ok){
        return;
    }

    try{

        const token =
        localStorage.getItem(
            "access_token"
        );

        const res =
        await fetch(
            `${API_BASE}/admin/suspend-user/${hrId}`,
            {
                method:"POST",
                headers:{
                    Authorization:
                    "Bearer " + token
                }
            }
        );

        const data =
        await res.json();

        alert(
            "User Suspended Successfully"
        );

        loadHRUsers();

    }
    catch(err){

        console.error(err);

        alert(
            "Failed to Suspend User"
        );

    }

}
async function activateUser(hrId){

    try{

        const token =
        localStorage.getItem(
            "access_token"
        );

        await fetch(
            `${API_BASE}/admin/activate-user/${hrId}`,
            {
                method:"POST",
                headers:{
                    Authorization:
                    "Bearer " + token
                }
            }
        );

        alert(
            "User Activated Successfully"
        );

        loadHRUsers();

    }
    catch(err){

        console.error(err);

        alert(
            "Activation Failed"
        );

    }

}
// INIT
loadAdminData();