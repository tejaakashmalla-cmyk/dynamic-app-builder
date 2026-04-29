const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 PostgreSQL Connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "dynamic_app",
  password: "teja123akash321", // 🔴 put your password
  port: 5432,
});

// 🔥 Auto create table
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        entity TEXT,
        data JSONB
      );
    `);
    console.log("DB ready ✅");
  } catch (err) {
    console.error("DB error ❌", err);
  }
})();

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
app.post("/api/:entity", async (req, res) => {
  const entity = req.params.entity;

  try {
    const result = await pool.query(
      "INSERT INTO records (entity, data) VALUES ($1, $2) RETURNING *",
      [entity, req.body]
    );

    res.json({
      id: result.rows[0].id,
      ...req.body,
    });
  } catch (err) {
    console.error("POST ERROR:", err);
    res.status(500).send("DB error");
  }
});

// READ
app.get("/api/:entity", async (req, res) => {
  const entity = req.params.entity;

  try {
    const result = await pool.query(
      "SELECT * FROM records WHERE entity=$1",
      [entity]
    );

    const data = result.rows.map((row) => ({
      id: row.id,
      ...row.data,
    }));

    res.json(data);
  } catch (err) {
    console.error("GET ERROR:", err);
    res.status(500).send("DB error");
  }
});

// UPDATE
app.put("/api/:entity/:id", async (req, res) => {
  const entity = req.params.entity;
  const id = req.params.id;

  try {
    await pool.query(
      "UPDATE records SET data=$1 WHERE id=$2 AND entity=$3",
      [req.body, id, entity]
    );

    res.send("Updated");
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).send("DB error");
  }
});

// DELETE
app.delete("/api/:entity/:id", async (req, res) => {
  const entity = req.params.entity;
  const id = req.params.id;

  try {
    await pool.query(
      "DELETE FROM records WHERE id=$1 AND entity=$2",
      [id, entity]
    );

    res.send("Deleted");
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).send("DB error");
  }
});

// ---------------- CSV IMPORT ----------------
app.post("/csv/:entity", async (req, res) => {
  const entity = req.params.entity;
  const rows = req.body;

  try {
    for (let row of rows) {
      await pool.query(
        "INSERT INTO records (entity, data) VALUES ($1, $2)",
        [entity, row]
      );
    }

    res.send("CSV data added");
  } catch (err) {
    console.error("CSV ERROR:", err);
    res.status(500).send("DB error");
  }
});

// ---------------- START ----------------
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});