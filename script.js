let currentFilter = "All";
/* =====================================
   Admin Configuration
===================================== */
const ADMIN_EMAIL = "adminkiet@gmail.com";

/* =====================================
   Admin Login
===================================== */
function setAdmin() {
    const email = document.getElementById("adminEmail").value;

    if (email === ADMIN_EMAIL) {
        sessionStorage.setItem("isAdmin", "true");
        showToast("Admin access granted", "success");
        setTimeout(() => {
            window.location.href = "admin.html";
        }, 800);
        
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
    try{
        const list = document.getElementById("lostList");

        if (!list) return;
        const response = await fetch("/lost-items");
        

        if (!response.ok) {
            throw new Error("Failed to fetch lost items.");
        } 
        const lostItems = await response.json();
        list.innerHTML = "";
        
        const searchText = document
            .getElementById("searchBox")
            .value
            .toLowerCase();

        
        if (!list) return; //incase the element is not found list will become null and list.innerHTML will crash.

        const isAdmin = sessionStorage.getItem("isAdmin") ==="true";

        

        
        if (lostItems.length === 0){
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
            if (
                !item.item.toLowerCase().includes(searchText)
            ){
                return;
            }
            if (
                currentFilter !== "All" &&
                item.status !== currentFilter
            ){
                return;
            }
            let repliesHTML = "";

            if (item.replies && item.replies.length > 0){
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
                            <p><strong>Reply By:</strong>${reply.email}</p>
                            <p><strong>Message :</strong>${reply.message}</p>
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
                    `<img src="${item.image}" alt="${item.item}" class="lost-item-image">`
                    :
                    ""
                }
                

                <p>
                <strong>Description</strong><br>${item.description}</p>

            
            <div class="status-badge ${
            item.status==="Pending"
                ?
                "status-pending"
                :
                "status-found"
                }">

                ${
                item.status==="Pending"
                ?
                "🟡 Pending"
                :
                "🟢 Found"
                }

            </div>
        
            

                ${
                    item.status==="Pending"
                    ?
                    `
                    <div class="action-buttons">

    
                    <button class="found-btn" onclick="markAsFound(this,'${item._id}')">
                        <i class="fa-solid fa-check"></i>
                            Mark as Found
                    </button>
                    ${
                    isAdmin
                    ?
                    `
                    <button class="delete-btn" onclick="deleteReport('${item._id}')">
                        <i class="fa-solid fa-trash"></i>
                            Delete
                    </button>
                    `
                    :
                    ""
                    }

                    <button class="reply-btn" onclick="openReply('${item._id}')">
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
                    <button class="delete-btn" onclick="deleteReport('${item._id}')">
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
        if(currentFilter === "All"){
        document.getElementById("filterAll").classList.add("filter-active");
    }
    }
    catch(error){
        showToast("Unable to load lost items.","error");
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
    
    const respone = await fetch(`/lost-items/${id}` ,{
        method: "DELETE",
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
    const statsResponse = await fetch("/admin/stats");
    const stats = await statsResponse.json();

    document.getElementById("totalReports").innerText = stats.total;
    document.getElementById("pendingReports").innerText = stats.pending;
    document.getElementById("foundReports").innerText = stats.found;

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

}
/* =====================================
   Mark Item as Found (Reporter Only)
===================================== */
async function markAsFound(button, id) {
    const email = prompt("Enter your email to confirm:");

    if (!email) {
        return;
    }
    
   
   
    const originalHTML = button.innerHTML;
  
    button.disabled = true;
    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Marking...
    `;

    try {

        const response = await fetch(`/lost-items/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                isAdmin: sessionStorage.getItem("isAdmin") === "true"
            })
        });

        const message = await response.text();

        if (response.ok) {
            showToast("Item marked as Found!", "success");
            
            if (document.getElementById("adminList")) {
                loadAdminDashboard();
            }
            if (document.getElementById("lostList")) {
                loadLostItems();
            }
        } else {
            showToast(message, "error");
        }
    } catch (err) {
        showToast("Server Error", "error");
    } finally {
        // Restore button
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


