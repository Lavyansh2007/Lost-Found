/* =====================================
   Admin Configuration
===================================== */
var ADMIN_EMAIL = "adminkiet@gmail.com";

/* =====================================
   Admin Login
===================================== */
function setAdmin() {
    var email = document.getElementById("adminEmail").value;

    if (email === ADMIN_EMAIL) {
        localStorage.setItem("isAdmin", "true");
        alert("Admin access granted");
        updateAdminUI();
    } else {
        alert("Invalid admin email");
    }
    loadLostItems();
}

/* =====================================
   Admin Logout
===================================== */
function adminLogout() {
    localStorage.removeItem("isAdmin");
    alert("Admin logged out successfully");
    updateAdminUI();
    loadLostItems();
}

/* =====================================
   Update Admin UI
===================================== */
function updateAdminUI() {
    var isAdmin = localStorage.getItem("isAdmin") === "true";

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

async function loadLostItems() {
    const response = await fetch("/lost-items");

    if (!response.ok) {
        throw new Error("Failed to fetch lost items.");
    } 
    const lostItems = await response.json();
    // console.log(lostItems);
    // console.log("Loop is starting");

    const list = document.getElementById("lostList");
    if (!list) return; //incase the element is not found list will become null and list.innerHTML will crash.

    list.innerHTML = "" ;

    // const isAdmin = localStorage.getItem("isAdmin") == "true";

    if (lostItems.length == 0){
        list.innerHTML = "<p>No lost items reported yet.</p>";
        return;
    }
    lostItems.forEach(function(item) {
        let repliesHTML = "";

        if (item.replies && item.replies.length > 0){
            repliesHTML += `
                <hr>
                <h4>Replies</h4>
            `;
            item.replies.forEach(function(reply){
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
            <h3>${item.item}</h3>

            <p><strong>Description: </strong>${item.description}</p>

            <p><strong>Status: </strong>${item.status}</p>

            ${
                item.status === "Pending"
                ? `<button onclick="markAsFound('${item._id}')">
                        Mark as Found
                   </button>`
                : ""
            }
            <button onclick="openReply('${item._id}')">
                Reply
            </button>
            ${repliesHTML}
        </div>
        
    `;

    });
}

/* =====================================
   Submit Lost Item
===================================== */
function submitLostItem() {
    var item = document.getElementById("item").value;
    var desc = document.getElementById("desc").value;
    var email = document.getElementById("email").value;

    var otp = Math.floor(1000 + Math.random() * 9000);
    var userOtp = prompt("OTP sent to email (demo): " + otp);

    if (userOtp != otp) {
        alert("Email verification failed");
        return false;
    }

    var lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];

    lostItems.push({
        item: item,
        desc: desc,
        email: email,
        status: "Pending",
        replies: []
    });

    localStorage.setItem("lostItems", JSON.stringify(lostItems));
    alert("Lost item reported successfully");
    return true;
}

/* =====================================
   Mark Item as Found (Reporter Only)
===================================== */
async function markAsFound(id) {
    var email = prompt("Enter your email to confirm: ");
    const response = await fetch(`/lost-items/${id}`,{
        method: "PATCH",

        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email
        })
    });
    const message = await response.text();
    if (response.ok) {
            alert(message);
            loadLostItems();
        } else {
            alert(message);
            return;
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
    alert("savereply called!!");
    event.preventDefault();
    console.log("1");
    
    const email = document.getElementById("replyEmail").value;
    console.log("2");
    const message = document.getElementById("replyMsg").value;
    console.log("3");
    const id = localStorage.getItem("replyId");
    console.log("ID= ",id);
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
    console.log("5");
    const replyMessage = await response.text();

    if (response.ok) {
        alert(replyMessage);
        window.location.href = "lostitems.html";
    }else {
        alert(replyMessage);
    
    } 
    
    
    return false;
    
}

/* =====================================
   Delete Report (Admin Only)
===================================== */
function deleteReport(index) {
    if (localStorage.getItem("isAdmin") !== "true") {
        alert("Only admin can delete reports");
        return;
    }

    if (!confirm("Are you sure you want to delete this report?")) return;

    var lostItems = JSON.parse(localStorage.getItem("lostItems"));
    lostItems.splice(index, 1);
    localStorage.setItem("lostItems", JSON.stringify(lostItems));

    alert("Report deleted");
    loadLostItems();
}
