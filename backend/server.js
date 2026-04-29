const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = "data.json";

// Load existing data
let database = {};
if (fs.existsSync(DATA_FILE)) {
  database = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

// Save data
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(database, null, 2));
}

// Root route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// CREATE
app.post("/api/:entity", (req, res) => {
  const entity = req.params.entity;

  if (!database[entity]) database[entity] = [];

  const newItem = {
    id: Date.now(),
    ...req.body,
  };

  database[entity].push(newItem);
  saveData();

  res.json(newItem);
});

// READ
app.get("/api/:entity", (req, res) => {
  const entity = req.params.entity;
  res.json(database[entity] || []);
});

// UPDATE
app.put("/api/:entity/:id", (req, res) => {
  const entity = req.params.entity;
  const id = Number(req.params.id);

  database[entity] = (database[entity] || []).map((item) =>
    item.id === id ? { ...item, ...req.body } : item
  );

  saveData();
  res.send("Updated");
});

// DELETE
app.delete("/api/:entity/:id", (req, res) => {
  const entity = req.params.entity;
  const id = Number(req.params.id);

  database[entity] = (database[entity] || []).filter(
    (item) => item.id !== id
  );

  saveData();
  res.send("Deleted");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running 🚀");
});