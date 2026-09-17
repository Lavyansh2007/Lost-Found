let currentFilter = "All";

/* =====================================
   Report Timestamp
===================================== */
function formatReportTimestamp(createdAt) {
    if (!createdAt) return "Not available";

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}
/* =====================================
   Admin Configuration
===================================== */
const ADMIN_EMAIL = "adminkiet@gmail.com";

/* =====================================
   Admin Login
===================================== */
async function setAdmin() {
    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    try {
        const response = await fetch("/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            showToast("Invalid admin credentials", "error");
            return;
        }

        sessionStorage.setItem("isAdmin", "true");
        sessionStorage.setItem("adminToken", data.token);

        showToast("Admin access granted", "success");

        setTimeout(() => {
            window.location.href = "admin.html";
        }, 800);

    } catch (error) {
        console.error("Admin login error:", error);
        showToast("Unable to login as admin", "error");
    }
}

/* =====================================
   Admin Logout
===================================== */
function adminLogout() {

    sessionStorage.removeItem("isAdmin");

    showToast("Logged Out", "success");

    window.location.href = "lostitems.html";
}

/* =====================================
   Update Admin UI
===================================== */
function updateAdminUI() {
    var isAdmin = sessionStorage.getItem("isAdmin") === "true";

    var loginBox = document.getElementById("adminLoginBox");
    var logoutBox = document.getElementById("adminLogoutBox");

    if (!loginBox || !logoutBox) return;

    if (isAdmin) {
        loginBox.style.display = "none";
        logoutBox.style.display = "block";
    } else {
        loginBox.style.display = "block";
        logoutBox.style.display = "none";
    }
}
function setFilter(status){

    currentFilter = status;

    document
        .querySelectorAll(".filter-container button")
        .forEach(function(btn){

            btn.classList.remove("filter-active");

        });

    document
        .getElementById("filter" + status)
        .classList.add("filter-active");

    loadLostItems();

}
async function loadLostItems() {
    try {
        const list = document.getElementById("lostList");

        if (!list) return;

        const searchText = document
            .getElementById("searchBox")
            .value
            .trim();

        // Build backend URL
        const params = new URLSearchParams();

        if (searchText) {
            params.append("search", searchText);
        }

        if (currentFilter !== "All") {
            params.append("status", currentFilter);
        }
        const sortValue = document.getElementById("sortSelect").value;
        if (sortSelect) {
            params.append("sort", sortValue);
        }

        const response = await fetch(
            `/lost-items?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch lost items.");
        }

        const lostItems = await response.json();

        list.innerHTML = "";

        const isAdmin =
            sessionStorage.getItem("isAdmin") === "true";

        if (lostItems.length === 0) {
            list.innerHTML = `
                <div class="card" style="text-align:center;">
                    <h2>📭</h2>
                    <h3>No Lost Items Found</h3>
                    <p>Try changing your search or filter.</p>
                </div>
            `;
            return;
        }

        lostItems.forEach(item => {

            let repliesHTML = "";

            if (item.replies && item.replies.length > 0) {
                repliesHTML += `
                    <hr>
                    <h4>
                        <i class="fa-solid fa-comments"></i>
                        Replies
                    </h4>
                `;

                item.replies.forEach(reply => {
                    repliesHTML += `
                        <div class="reply-card">
                            <p>
                                <strong>Reply By:</strong>
                                ${reply.email}
                            </p>

                            <p>
                                <strong>Message :</strong>
                                ${reply.message}
                            </p>
                        </div>
                    `;
                });
            }

            list.innerHTML += `
                <div class="card">

                    <h3>
                        <i class="fa-solid fa-box"></i>
                        ${item.item}
                    </h3>

                    ${
                        item.image
                        ?
                        `<img 
                            src="${item.image}" 
                            alt="${item.item}" 
                            class="lost-item-image">
                        `
                        :
                        ""
                    }

                    <p>
                        <strong>Description</strong><br>
                        ${item.description}
                    </p>

                    <p>
                        <strong>Reported on:</strong>
                        ${formatReportTimestamp(item.createdAt)}
                    </p>

                    <div class="status-badge ${
                        item.status === "Pending"
                            ? "status-pending"
                            : "status-found"
                    }">

                        ${
                            item.status === "Pending"
                                ? "🟡 Pending"
                                : "🟢 Found"
                        }

                    </div>

                    ${
                        item.status === "Pending"
                        ?
                        `
                        <div class="action-buttons">

                            <button 
                                class="found-btn" 
                                onclick="markAsFound(this,'${item._id}')">

                                <i class="fa-solid fa-check"></i>
                                Mark as Found

                            </button>

                            ${
                                isAdmin
                                ?
                                `
                                <button 
                                    class="delete-btn" 
                                    onclick="deleteReport('${item._id}')">

                                    <i class="fa-solid fa-trash"></i>
                                    Delete

                                </button>
                                `
                                :
                                ""
                            }

                            <button 
                                class="reply-btn" 
                                onclick="openReply('${item._id}')">

                                <i class="fa-solid fa-reply"></i>
                                Reply

                            </button>

                        </div>
                        `
                        :
                        `
                        <div class="action-buttons">

                            ${
                                isAdmin
                                ?
                                `
                                <button 
                                    class="delete-btn" 
                                    onclick="deleteReport('${item._id}')">

                                    <i class="fa-solid fa-trash"></i>
                                    Delete

                                </button>
                                `
                                :
                                ""
                            }

                        </div>
                        `
                    }

                    ${repliesHTML}

                </div>
            `;
        });

        // Keep All button active when no specific filter is selected
        if (currentFilter === "All") {
            document
                .getElementById("filterAll")
                .classList.add("filter-active");
        }

    } catch (error) {
        showToast("Unable to load lost items.", "error");
        console.error(error);
    }
}
function showToast(message, type){
    const toast = document.createElement("div");
    toast.className=`toast toast-${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(function(){
        toast.remove();
    },3000);
}

async function deleteReport(id) {
    try{
   
    const confirmDelete = confirm("Are you sure you want to delete this item?");

    if (!confirmDelete){
        return;
    }
    const token = sessionStorage.getItem("adminToken");
    
    const respone = await fetch(`/lost-items/${id}` ,{
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    
    const message = await respone.text ();
    
    if (respone.ok) {
        showToast(message,"success");
        
        if (document.getElementById("adminList")) {
            loadAdminDashboard();
        }
        if (document.getElementById("lostList")) {
            loadLostItems();
        }
    } else{
        showToast(message,"error");
    }
    } catch(error){
        showToast("Something went wrong.","error");
        console.error(error);
    }
    
}


async function verifyEmail(){
    const email = document.getElementById("email").value;
     if (!email){
        showToast("Please enter your email.", "error");
        return;
     }
     try{
        const response = await fetch("/send-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email
            })
        });
        const result = await response.json();
        if (!result.success) {
            showToast(result.message, "error");
            return;
        }
        showToast("OTP sent to your email.", "success");
        document.getElementById("otpSection").style.display = "block";
     } catch (error){
        console.error(error);
        showToast("Failed to send OTP.", "error");
     }
}

async function verifyOTP() {
    const email = document.getElementById("email").value;
    const otp = document.getElementById("otpInput").value;

    try {
        const response = await fetch("/verify-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                otp
            })
        });
        const result = await response.json();

        if (!result.success){
            showToast(result.message, "error");
            return;
        }

        showToast("Email verified!", "success");
       
        document.querySelector("form").submit(); 
    } catch (error) {
        console.error(error);
        showToast("Verification failed!","error");
    }
}


async function loadAdminDashboard() {

    // Load statistics
    const token = sessionStorage.getItem("adminToken");

    const statsResponse = await fetch("/admin/stats", {
    headers: {
        "Authorization": `Bearer ${token}`
        }
    });
    const stats = await statsResponse.json();

    document.getElementById("totalReports").innerText = stats.total;
    document.getElementById("pendingReports").innerText = stats.pending;
    document.getElementById("foundReports").innerText = stats.found;
    document.getElementById("deletedReports").innerText = stats.deleted;

    // Load all reports
    const response = await fetch("/lost-items");
    const items = await response.json();

    const adminList = document.getElementById("adminList");

    adminList.innerHTML = "";

    items.forEach(item => {

        adminList.innerHTML += `

        <div class="card">

            <h3>
                <i class="fa-solid fa-box"></i>
                ${item.item}
            </h3>
            ${
                item.image
                ?
                `
                <img 
                    src="${item.image}"
                    alt="${item.item}"
                    class="lost-item-image">
                `
                :
                ""
            }

            <p>
                <strong>Description :</strong>
                ${item.description}
            </p>

            <p>
                <strong>Email :</strong>
                ${item.email}
            </p>

            <p>
                <strong>Reported on :</strong>
                ${formatReportTimestamp(item.createdAt)}
            </p>

            <div class="status-badge ${
                item.status === "Pending"
                    ? "status-pending"
                    : "status-found"
            }">

                ${item.status}

            </div>

            <div class="action-buttons">

                ${
                    item.status === "Pending"
                    ?
                    `
                    <button class="found-btn"
                        onclick="markAsFound(this,'${item._id}')">

                        <i class="fa-solid fa-check"></i>

                        Mark as Found

                    </button>
                    `
                    :
                    ""
                }

                <button class="delete-btn"
                    onclick="deleteReport('${item._id}')">

                    <i class="fa-solid fa-trash"></i>

                    Delete

                </button>

            </div>

        </div>

        `;

    });
        
    loadDeletedItems();

}
/* =====================================
   Mark As Found Modal
===================================== */

function showMarkFoundModal() {

    return new Promise(function(resolve) {

        const overlay = document.createElement("div");

        overlay.className = "found-modal-overlay";

        overlay.innerHTML = `
            <div class="found-modal">

                <h3>
                    <i class="fa-solid fa-circle-check"></i>
                    Mark as Found
                </h3>

                <p class="found-modal-subtitle">
                    Enter the email and password you created
                    when reporting this item.
                </p>

                <label for="foundEmail">
                    <i class="fa-solid fa-envelope"></i>
                    Email
                </label>

                <input
                    type="email"
                    id="foundEmail"
                    placeholder="Enter your email"
                    autocomplete="email"
                >

                <label for="foundPassword">
                    <i class="fa-solid fa-lock"></i>
                    Report Password
                </label>

                <input
                    type="password"
                    id="foundPassword"
                    placeholder="Enter your report password"
                    autocomplete="current-password"
                >

                <div class="found-modal-actions">

                    <button
                        type="button"
                        class="found-modal-cancel">
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="found-modal-submit">
                        <i class="fa-solid fa-check"></i>
                        Mark as Found
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        const emailInput =
            overlay.querySelector("#foundEmail");

        const passwordInput =
            overlay.querySelector("#foundPassword");

        const cancelButton =
            overlay.querySelector(".found-modal-cancel");

        const submitButton =
            overlay.querySelector(".found-modal-submit");


        function closeModal(result) {

            overlay.remove();

            resolve(result);
        }

        // Cancel button
        cancelButton.addEventListener("click", function() {

            closeModal(null);

        });

        // Mark as Found button
        submitButton.addEventListener("click", function() {

            const email = emailInput.value.trim();

            const password = passwordInput.value;


            if (!email || !password) {

                showToast(
                    "Please enter your email and report password.",
                    "error"
                );

                return;
            }
            closeModal({

                email: email,
                password: password

            });

        });
        // Click outside the popup to close
        overlay.addEventListener("click", function(event) {

            if (event.target === overlay) {

                closeModal(null);

            }

        });
        // Press Enter in password field
        passwordInput.addEventListener(
            "keydown",
            function(event) {

                if (event.key === "Enter") {

                    submitButton.click();

                }

            }
        );


        emailInput.focus();

    });
}
/* =====================================
   Mark Item as Found
===================================== */

async function markAsFound(button, id) {

    const isAdmin =
        sessionStorage.getItem("isAdmin") === "true";


    let credentials = null;

    // Normal user
    if (!isAdmin) {

        credentials = await showMarkFoundModal();


        if (!credentials) {

            return;

        }

    }
    const originalHTML = button.innerHTML;

    button.disabled = true;

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Marking...
    `;
    try {

        let url;

        let options;
        /* =========================
           ADMIN
        ========================= */

        if (isAdmin) {

            url = `/admin/lost-items/${id}`;

            options = {

                method: "PATCH",

                headers: {

                    "Authorization":
                        `Bearer ${sessionStorage.getItem("adminToken")}`

                }

            };

        }
        /* =========================
           NORMAL USER
        ========================= */

        else {

            url = `/lost-items/${id}`;

            options = {

                method: "PATCH",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    email: credentials.email,

                    password: credentials.password

                })

            };

        }
        const response =
            await fetch(url, options);


        const message =
            await response.text();


        if (response.ok) {

            showToast(
                "Item marked as Found!",
                "success"
            );


            if (document.getElementById("adminList")) {

                loadAdminDashboard();

            }


            if (document.getElementById("lostList")) {

                loadLostItems();

            }

        }

        else {

            showToast(
                message,
                "error"
            );

        }

    }
    catch (error) {

        console.error(error);

        showToast(
            "Server Error",
            "error"
        );
    }
    finally {

        button.disabled = false;

        button.innerHTML = originalHTML;

    }

}

/* =====================================
   Open Reply Page
===================================== */
function openReply(id) {
    localStorage.setItem("replyId", id);
    window.location.href = "reply.html";
}

/* =====================================
   Save Reply
===================================== */
async function saveReply(event) {
    try{
   
    event.preventDefault();
    
    
    const email = document.getElementById("replyEmail").value;
    
    const message = document.getElementById("replyMsg").value;

    const id = localStorage.getItem("replyId");
   
    const response = await fetch(`/lost-items/${id}/reply`,{
        method: "PATCH",

        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            message: message
        })
    });
    
    const replyMessage = await response.text();

    if (response.ok) {
        showToast(replyMessage, "success");
        window.location.href = "lostitems.html";
    }else {
        showToast(replyMessage, "error");
    
    } 
    
    
    return false;
    } catch (error){
        showToast("Something went wrong.","error");
        console.error(error);
}
    
}
function checkReportSuccess() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("submitted") === "true"){
        showToast("Report submitted successfully!","success");

        //Remove ?submitted=true from url
        window.history.replaceState({}, document.title,window.location.pathname);
    }
}
/* =====================================
   Load Deleted Reports (Admin Only)
===================================== */
async function loadDeletedItems() {

    const token = sessionStorage.getItem("adminToken");

    try {

        const response = await fetch("/admin/deleted-items", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch deleted reports.");
        }

        const deletedItems = await response.json();

        const deletedList = document.getElementById("deletedList");

        if (!deletedList) return;

        deletedList.innerHTML = "";

        if (deletedItems.length === 0) {

            deletedList.innerHTML = `
                <div class="card" style="text-align:center;">
                    <h3>No Deleted Reports</h3>
                    <p>There are currently no deleted reports.</p>
                </div>
            `;

            return;
        }

        deletedItems.forEach(item => {

            deletedList.innerHTML += `

                <div class="card">

                    <h3>
                        <i class="fa-solid fa-box"></i>
                        ${item.item}
                    </h3>

                    ${
                        item.image
                        ?
                        `
                        <img
                            src="${item.image}"
                            alt="${item.item}"
                            class="lost-item-image">
                        `
                        :
                        ""
                    }

                    <p>
                        <strong>Description :</strong>
                        ${item.description}
                    </p>

                    <p>
                        <strong>Email :</strong>
                        ${item.email}
                    </p>

                    <p>
                        <strong>Reported on :</strong>
                        ${formatReportTimestamp(item.createdAt)}
                    </p>

                    <p>
                        <strong>Deleted on :</strong>
                        ${formatReportTimestamp(item.deletedAt)}
                    </p>

                    <div class="status-badge">
                        🗑️ Deleted
                    </div>

                </div>

            `;

        });

    } catch (error) {

        console.error("Error loading deleted reports:", error);

        showToast(
            "Unable to load deleted reports.",
            "error"
        );
    }
}

