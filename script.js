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
   Load Lost Items
===================================== */
function loadLostItems() {
    var lostItems = JSON.parse(localStorage.getItem("lostItems")) || [];
    var list = document.getElementById("lostList");
    if (!list) return;

    list.innerHTML = "";
    var isAdmin = localStorage.getItem("isAdmin") === "true";

    if (lostItems.length === 0) {
        list.innerHTML = "<p>No lost items reported yet.</p>";
        return;
    }

    lostItems.forEach(function(item, index) {

        if (!item.status) item.status = "Pending";
        if (!item.replies) item.replies = [];

        var statusColor = item.status === "Found" ? "green" : "orange";

        var repliesHTML = "";
        if (item.replies.length > 0) {
            repliesHTML = "<h4>Replies:</h4>";
            item.replies.forEach(function(r) {
                repliesHTML += `<p><b>${r.email}:</b> ${r.msg}</p>`;
            });
        }

        var deleteBtn = "";
        if (isAdmin) {
            deleteBtn = `<button onclick="deleteReport(${index})">Delete Report</button>`;
        }

        var statusBtn = "";
        if (item.status === "Pending") {
            statusBtn = `<button onclick="markAsFound(${index})">Mark as Found</button>`;
        }

        list.innerHTML += `
        <div class="card">
            <h3>${item.item}</h3>
            <p>${item.desc}</p>
            <p><b>Status:</b> <span style="color:${statusColor}">${item.status}</span></p>
            ${repliesHTML}
            <button onclick="openReply(${index})">Reply (Found It)</button>
            ${statusBtn}
            ${deleteBtn}
        </div>`;
    });
}

/* =====================================
   Mark Item as Found (Reporter Only)
===================================== */
function markAsFound(index) {
    var email = prompt("Enter your email to confirm:");

    var lostItems = JSON.parse(localStorage.getItem("lostItems"));

    if (email !== lostItems[index].email) {
        alert("Only the person who reported this item can change the status.");
        return;
    }

    lostItems[index].status = "Found";
    localStorage.setItem("lostItems", JSON.stringify(lostItems));

    alert("Status updated to Found");
    loadLostItems();
}

/* =====================================
   Open Reply Page
===================================== */
function openReply(index) {
    localStorage.setItem("replyIndex", index);
    window.location.href = "reply.html";
}

/* =====================================
   Save Reply
===================================== */
function saveReply() {
    var email = document.getElementById("replyEmail").value;
    var msg = document.getElementById("replyMsg").value;

    var index = localStorage.getItem("replyIndex");
    var lostItems = JSON.parse(localStorage.getItem("lostItems"));

    if (!lostItems || index === null) {
        alert("Error saving reply");
        return false;
    }

    lostItems[index].replies.push({ email: email, msg: msg });
    localStorage.setItem("lostItems", JSON.stringify(lostItems));

    alert("Reply sent successfully");
    window.location.href = "lostitems.html";
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
