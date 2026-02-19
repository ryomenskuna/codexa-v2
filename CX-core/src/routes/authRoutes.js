import express from "express";
import { body, validationResult } from "express-validator";
import { register } from "../controllers/authController.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import pool from "../db.js"; // adjust if db config path is different
import { sendError } from "../utils/http.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, "Validation failed", "VALIDATION_ERROR");
  }
  return next();
};

// Manual register (already present)
router.post(
  "/register",
  [
    body("user_name").trim().isLength({ min: 3 }).withMessage("Username is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  handleValidationErrors,
  register
);

// ✅ New: Google login/signup
router.post(
  "/google",
  [body("token").isString().notEmpty().withMessage("Token is required")],
  handleValidationErrors,
  async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name } = payload;

    // Allow only @juetguna.in domain
    if (!email.endsWith("@juetguna.in")) {
      return sendError(
        res,
        403,
        "Only @juetguna.in emails allowed",
        "FORBIDDEN_DOMAIN"
      );
    }

    // Check if user exists
    let user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      // Insert new user
      const insertUser = await pool.query(
        `INSERT INTO users (user_name, first_name, last_name, email, role)
         VALUES ($1, $2, $3, $4, 'student')
         RETURNING user_id, user_name, email, role, created_at`,
        [email.split("@")[0], given_name || "", family_name || "", email]
      );
      user = insertUser;
    }

    const userData = user.rows[0];

    // Generate JWT
    const jwtToken = jwt.sign(
      { user_id: userData.user_id, email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token: jwtToken,
      user: userData,
    });
  } catch (err) {
    console.error("Google login error:", err);
    return sendError(res, 500, "Google authentication failed");
  }
});

export default router;