import express from "express";
import { applyAsTeacher } from "../controllers/teacherController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

// POST /teach/apply-teacher (must be an authenticated user)
router.post("/apply-teacher", verifyUser, applyAsTeacher);

export default router;
