import express from "express";
import { body, validationResult } from "express-validator";
import pool from "../db.js"; // your PostgreSQL pool connection
import { verifyTeacher } from "../middleware/verifyTeacher.js";
import { sendError } from "../utils/http.js";

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, "Validation failed", "VALIDATION_ERROR");
  }
  return next();
};

// Get all events (public)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY date ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching events:", err);
    return sendError(res, 500, "Error fetching events");
  }
});

// Add a new event (teacher only)
router.post(
  "/",
  verifyTeacher,
  [
    body("title").trim().isLength({ min: 3 }).withMessage("Title is required"),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
  ],
  handleValidationErrors,
  async (req, res) => {
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
      return sendError(res, 500, "Error adding event");
    }
  }
);

export default router;