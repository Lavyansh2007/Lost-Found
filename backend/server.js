const dns = require("dns");
dns.setServers(["8.8.8.8"]);

require("dotenv").config();

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

app.use(express.urlencoded({ extended: true }));
// When the browser submits a form, it doesn't send JavaScript objects.
// This middleware converts the incoming form data into req.body.

app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));
// Serves static files like CSS, JavaScript, and images.
// path.join() creates the correct path to the parent folder.

const PORT = process.env.PORT;

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.post("/report", async (req, res) => {
    try {
        console.log(req.body); // Logs the form data to the console

        const lostItem = {
            item: req.body.item,
            description: req.body.description,
            email: req.body.email,
            status: "Pending",
            replies: []
        };

        await lostItemsCollection.insertOne(lostItem); // Inserts the lost item data into the lostItems collection

        res.send("Report received successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to save report.");
    }
    
});
app.get("/lost-items", async (req,res) => {
    try {
        const data = await lostItemsCollection.find().toArray(); // Retrieves all documents from the lostItems collection
        res.send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to fetch lost items.");
    }
});
app.patch("/lost-items/:id", async (req,res) => { //HTML doesn't directly support patch like get or post so we need js fetch() to patch the data 
    try {
        const id = new ObjectId(req.params.id);
        const email =  req.body.email;

        const lostItem = await lostItemsCollection.findOne({
            _id: id
        });
        if (!lostItem){
            res.status(404).send("Item not found.");
            return;

        }
        if (email !== lostItem.email){
            res.status(403).send("You are not authorized to update this item.");
            return;

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

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});