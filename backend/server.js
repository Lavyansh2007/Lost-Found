require("dotenv").config();
const fs = require("fs");// fs - file system 
const dns = require("dns");
const jwt = require("jsonwebtoken");// jwt - JSON Web Token for secure data transmission
const bcrypt = require("bcryptjs");

const otpStore = new Map();

const multer = require("multer");// multer - middleware for handling multipart/form-data, which is primarily used for uploading files
const cloudinary = require("cloudinary").v2;// cloudinary - cloud-based image and video management service
const {CloudinaryStorage} = require("multer-storage-cloudinary");// multer-storage-cloudinary - multer storage engine for Cloudinary
// Use Google's DNS because some local ISP DNS servers
// fail to resolve MongoDB Atlas SRV records.
dns.setServers(["8.8.8.8"]);

async function sendOTP(email, otp) {
    try {
        const response = await fetch(process.env.APPS_SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                otp: otp,
                secret: process.env.APPS_SCRIPT_SECRET
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error("Google Apps Script error:", result);
            throw new Error(
                result.message || "Failed to send OTP email."
            );
        }

        console.log("OTP email sent successfully!");

        return true;

    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw error;
    }
}
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});// Configures Cloudinary with credentials from .env

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "lost-found-items", // Folder in Cloudinary where images will be stored
        allowed_formats: ["jpg", "jpeg", "png", "webp"], // Allowed image formats
    }
});

const upload = multer({
    storage: storage
});



const express = require("express"); // Returns the entire Express package
const path = require("path"); // Returns the entire Path package
const {MongoClient, ObjectId} = require("mongodb");

const uri = process.env.MONGODB_URI; // Reads the MongoDB URI from .env
const client = new MongoClient(uri); // Creates a MongoClient object (does NOT connect yet)

let lostItemsCollection; // Will store the collection after MongoDB connects

async function connectDB() {
    try {
        await client.connect(); // Wait until MongoDB connection is established

        const db = client.db("LostAndFound"); // Select the LostAndFound database
        lostItemsCollection = db.collection("lostItems"); // Select the lostItems collection

        console.log("Connected to MongoDB!");
    } catch (error) {
        console.log("MongoDB Connection Failed!");
        console.error(error);
    }
}

const app = express(); // Creates the Express application object
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
// When the browser submits a form, it doesn't send JavaScript objects.
// This middleware converts the incoming form data into req.body.



app.use(express.static(path.join(__dirname, "..")));
// Serves static files like CSS, JavaScript, and images.
// path.join() creates the correct path to the parent folder.


const PORT = process.env.PORT;

app.post("/admin/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    if (
        email !== process.env.ADMIN_EMAIL ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            success: false,
            message: "Invalid admin credentials."
        });
    }

    const token = jwt.sign(
        {
            email: email,
            role: "admin"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "2h"
        }
    );

    res.json({
        success: true,
        message: "Admin authenticated.",
        token: token
    });
});

function verifyAdmin(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Admin authentication required."
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });
        }

        req.admin = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin token."
        });
    }
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);

        otpStore.set(email, {
            otp: otp,
            expires: Date.now() + 5 * 60 * 1000
        });
        await sendOTP(email, otp);

        res.json({
            success: true,
            message: "OTP sent successfully."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to send OTP."
        });
    }
});

app.post("/verify-otp", (req, res) => {
    const { email , otp } = req.body;
    const storedOTP = otpStore.get(email);

    if (!storedOTP) {
        return res.status(400).json({
            success: false,
            message: "OTP not found. Please request a new one."
        });
    }
    if (Date.now() > storedOTP.expires) {
        otpStore.delete(email);

        return res.status(400).json({
            success: false,
            message: "OTP has expired."
        });
    }
        if (storedOTP.otp != otp){
            return res.status(400).json({
                success: false,
                message: "Incorrect OTP."
            });
        }
            otpStore.delete(email);

            res.json({
                success: true,
                message: "Email verified successfully."
            });
});

app.post("/report", upload.single("image"), async (req, res) => {
    try {

        const { item, description, email, reportPassword } = req.body;

        if (!item || !description || !email || !reportPassword) {
            return res.status(400).send("All required fields must be filled.");
        }

        if (reportPassword.length < 6) {
            return res.status(400).send("Password must be at least 6 characters.");
        }

        const passwordHash = await bcrypt.hash(reportPassword, 10);

        const lostItem = {
            item: item,
            description: description,
            email: email,
            passwordHash: passwordHash,
            image: req.file ? req.file.path : "",
            status: "Pending",
            replies: [],
            createdAt: new Date()
        };

        await lostItemsCollection.insertOne(lostItem);

        res.redirect("/lostitems.html?submitted=true");

    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to save report.");
    }
});

app.get("/lost-items", async (req, res) => {
    try {
        const { search, status, sort } = req.query;

        // Build MongoDB filter
        const filter = {
            deleted: { $ne: true } // Exclude deleted items
        };

        // Search item name or description
        if (search && search.trim() !== "") {
            filter.$or = [
                { item: { $regex: search.trim(), $options: "i" } },
                { description: { $regex: search.trim(), $options: "i" } }
            ];
        }

        // Filter by status
        if (status && status !== "All") {
            filter.status = status;
        }
        let sortOption = { createdAt: -1 }; // newest first

        if (sort === "oldest") {
            sortOption = { createdAt: 1 };
        }

        const data = await lostItemsCollection
            .find(filter)
            .sort(sortOption)
            .toArray();

        res.json(data);

    } catch (error) {
        console.error("Error fetching lost items:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch lost items."
        });
    }
});

app.get("/admin/stats", verifyAdmin, async(req, res) => {
    try {
        const activeFilter = {
            deleted: { $ne: true }
        };

        const total = await lostItemsCollection.countDocuments(
            activeFilter
        );

        const pending = await lostItemsCollection.countDocuments({
            ...activeFilter,
            status: "Pending"
        });

        const found = await lostItemsCollection.countDocuments({
            ...activeFilter,
            status: "Found"
        });
        const deleted = await lostItemsCollection.countDocuments({
            deleted: true
        });
        

        res.json({
            total,
            pending,
            found,
            deleted
        });

    } catch(error) {
        console.error(error);
        res.status(500).send("Unable to load statistics");
    }
});
app.get("/admin/deleted-items", verifyAdmin, async (req, res) => {
    try {
        const deletedItems = await lostItemsCollection
            .find({ deleted: true })
            .sort({ deletedAt: -1 })
            .toArray();

        res.json(deletedItems);

    } catch (error) {
        console.error("Error fetching deleted items:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch deleted items."
        });
    }
});

app.patch("/lost-items/:id", async (req,res) => { //HTML doesn't directly support patch like get or post so we need js fetch() to patch the data 
    try {
        const id = new ObjectId(req.params.id);
        const email =  req.body.email;
        const isAdmin = req.body.isAdmin;

        const lostItem = await lostItemsCollection.findOne({
            _id: id
        });
        if (!lostItem){
            res.status(404).send("Item not found.");
            return;

        }
        // Check if the user pressed Cancel or didn't enter anything
        if (!email) {
            return res.status(400).send("Email is required.");
        }

        

        const enteredEmail = email.trim().toLowerCase();
        const storedEmail = lostItem.email.trim().toLowerCase();

    

    
    if (!isAdmin && enteredEmail !== storedEmail) {
        return res.status(403).send("You are not authorized to update this item.");
    }

        await lostItemsCollection.updateOne(
            {
                _id: id
            },
            {
                $set: {
                    status: "Found"
                }
            }
        );
        res.send("Status updated successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to update status.");
    }
    
});

app.patch("/lost-items/:id", async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);

        const { email, password } = req.body;

        const lostItem = await lostItemsCollection.findOne({
            _id: id
        });

        if (!lostItem) {
            return res.status(404).send("Item not found.");
        }
        if (lostItem.deleted === true) {
            return res.status(400).send("This report has been deleted.");
        }
        if (!email || !password) {
            return res.status(400).send(
                "Email and report password are required."
            );
        }
        if (!lostItem.passwordHash) {
            return res.status(400).send(
                "This report was created before password protection was added."
            );
        }
        const enteredEmail = email.trim().toLowerCase();
        const storedEmail = lostItem.email.trim().toLowerCase();
        if (enteredEmail !== storedEmail) {
            return res.status(403).send(
                "Email does not match this report."
            );
        }
        const passwordCorrect = await bcrypt.compare(
            password,
            lostItem.passwordHash
        );
        if (!passwordCorrect) {
            return res.status(403).send(
                "Incorrect report password."
            );
        }
        if (lostItem.status === "Found") {
            return res.status(400).send(
                "This item is already marked as Found."
            );
        }

        await lostItemsCollection.updateOne(
            { _id: id },
            {
                $set: {
                    status: "Found"
                }
            }
        );

        res.send("Status updated successfully!");

    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to update status.");
    }
});
app.patch("/admin/lost-items/:id", verifyAdmin, async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);

        const lostItem = await lostItemsCollection.findOne({
            _id: id
        });

        if (!lostItem) {
            return res.status(404).send("Item not found.");
        }

        if (lostItem.deleted === true) {
            return res.status(400).send("This report has been deleted.");
        }

        if (lostItem.status === "Found") {
            return res.status(400).send(
                "This item is already marked as Found."
            );
        }

        await lostItemsCollection.updateOne(
            { _id: id },
            {
                $set: {
                    status: "Found"
                }
            }
        );

        res.send("Status updated successfully!");

    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to update status.");
    }
});

app.delete("/lost-items/:id", verifyAdmin, async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        
        const lostItem = await lostItemsCollection.findOne ({
            _id: id
        });
        if (!lostItem) {
            return res.status(404).send("Item not found!");
        }
        await lostItemsCollection.updateOne(
           {_id: id},
           {
            $set: {
                deleted: true,
                deletedAt: new Date()
            }
           }
        );
        res.send("Item deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to delete item.");
    }

});

app.get("/test-email", async (req, res) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    await sendOTP(process.env.EMAIL_USER, otp);

    res.send("Test email sent! Check your inbox.");
});

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

