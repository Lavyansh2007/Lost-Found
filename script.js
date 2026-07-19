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
    console.log(lostItems);
    console.log("Loop is starting");

    const list = document.getElementById("lostList");
    if (!list) return; //incase the element is not found list will become null and list.innerHTML will crash.

    list.innerHTML = "" ;

    const isAdmin = localStorage.getItem("isAdmin") == "true";

    if (lostItems.length == 0){
        list.innerHTML = "<p>No lost items reported yet.</p>";
        return;
    }
    lostItems.forEach(function(item){
        const card = document.createElement("div");
        card.innerHTML = `
            <h3>${item.item}</h3>
            <p>Description: ${item.description}</p>
            <p>Status: ${item.status}</p>
            `;
        list.appendChild(card);

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
    if (response.ok) {
            console.log("Success!!");
            loadLostItems();
        } else {
            alert("Failed!!");
            return;
        }
    
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
