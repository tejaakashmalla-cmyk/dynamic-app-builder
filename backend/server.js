const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 FILE DATABASE
const DATA_FILE = "data.json";

let database = {};
if (fs.existsSync(DATA_FILE)) {
  database = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(database, null, 2));
}

// ---------------- CONFIG ----------------
let config = {};

app.post("/config", (req, res) => {
  config = req.body;
  res.send("Config saved");
});

app.get("/config", (req, res) => {
  res.json(config);
});

// ---------------- AUTH (simple mock) ----------------
let users = [];

app.post("/auth/register", (req, res) => {
  const { email, password } = req.body;
  users.push({ email, password });
  res.send("User registered");
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).send("Invalid credentials");
  }

  res.json({ token: email });
});

// ---------------- CRUD ----------------

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

  const data = database[entity] || [];
  res.json(data);
});

// UPDATE
app.put("/api/:entity/:id", (req, res) => {
  const entity = req.params.entity;
  const id = Number(req.params.id);

  if (!database[entity]) return res.status(404).send("Entity not found");

  database[entity] = database[entity].map((item) =>
    item.id === id ? { ...item, ...req.body } : item
  );

  saveData();
  res.send("Updated");
});

// DELETE
app.delete("/api/:entity/:id", (req, res) => {
  const entity = req.params.entity;
  const id = Number(req.params.id);

  if (!database[entity]) return res.status(404).send("Entity not found");

  database[entity] = database[entity].filter(
    (item) => item.id !== id
  );

  saveData();
  res.send("Deleted");
});

// ---------------- CSV IMPORT ----------------
app.post("/csv/:entity", (req, res) => {
  const entity = req.params.entity;
  const rows = req.body;

  if (!database[entity]) database[entity] = [];

  rows.forEach((row) => {
    database[entity].push({
      id: Date.now() + Math.random(),
      ...row,
    });
  });

  saveData();
  res.send("CSV data added");
});

// ---------------- ROOT ----------------
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ---------------- START ----------------
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running 🚀");
});