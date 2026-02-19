import express from "express";
import pool from "../db.js"; // your PostgreSQL pool connection
const router = express.Router();

// Get all events
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY date ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Error fetching events" });
  }
});

// Add a new event (teacher only)
router.post("/", async (req, res) => {
  const { title, description, date } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO events (title, description, date) VALUES ($1, $2, $3) RETURNING *",
      [title, description, date]
    );
    console.log("Inserted event:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding event:", err);
    res.status(500).json({ message: "Error adding event" });
  }
});

export default router;