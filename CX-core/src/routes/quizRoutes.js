import express from "express";
import { body, validationResult } from "express-validator";
import pool from "../db.js";
import { verifyUser } from "../middleware/auth.js";
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

// -------------------------------------------------------
// CREATE QUIZ (teacher only)
// -------------------------------------------------------
router.post(
  "/quizzes",
  verifyTeacher,
  [
    body("name").trim().isLength({ min: 3 }).withMessage("Name is required"),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description is required"),
    body("start_time").isISO8601().withMessage("Valid start_time is required"),
    body("end_time").isISO8601().withMessage("Valid end_time is required"),
  ],
  handleValidationErrors,
  async (req, res) => {
  const {
    name,
    description,
    instructions,
    start_time,
    end_time,
    created_by,
    is_published,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO quizzes 
        (name, description, instructions, start_time, end_time, created_by, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        description,
        instructions,
        start_time,
        end_time,
        created_by,
        is_published,
      ]
    );
    res.json({ message: "Quiz created", quiz: result.rows[0] });
  } catch (err) {
    console.error("Create quiz error:", err);
    return sendError(res, 500, "Error creating quiz");
  }
}
);

// REGISTER for a quiz (for upcoming quizzes) - authenticated users
router.post("/quizzes/:id/register", verifyUser, async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  const userId = req.user.user_id;

  try {
    // Check if already registered
    const check = await pool.query(
      `SELECT * FROM quiz_participants WHERE quiz_id = $1 AND user_id = $2`,
      [quizId, userId]
    );

    if (check.rows.length > 0) {
      return res.json({ registered: true, message: "Already registered" });
    }

    // Register new participant
    await pool.query(
      `INSERT INTO quiz_participants (quiz_id, user_id) VALUES ($1, $2)`,
      [quizId, userId]
    );

    return res.json({ registered: true, message: "Registration successful" });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Error registering for quiz");
  }
});

// -------------------------------------------------------
// ADD QUESTION (teacher only)
// -------------------------------------------------------
router.post(
  "/quizzes/:quizId/questions",
  verifyTeacher,
  [
    body("question").trim().isLength({ min: 5 }).withMessage("Question is required"),
    body("marks").isNumeric().withMessage("Marks must be a number"),
    body("options")
      .isArray({ min: 2, max: 4 })
      .withMessage("Options must be an array of 2-4 items"),
  ],
  handleValidationErrors,
  async (req, res) => {
  const { quizId } = req.params;
  const { question, marks, options } = req.body;

  const option_a = options[0]?.text || "";
  const option_b = options[1]?.text || "";
  const option_c = options[2]?.text || "";
  const option_d = options[3]?.text || "";

  const correct_index = options.findIndex((o) => o.isCorrect);
  const correct_answer = ["A", "B", "C", "D"][correct_index];

  if (correct_index === -1 || !correct_answer) {
    return sendError(res, 400, "At least one correct option is required");
  }

  try {
    const result = await pool.query(
      `INSERT INTO quiz_questions 
        (quiz_id, question_text, marks, option_a, option_b, option_c, option_d, correct_answer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        quizId,
        question,
        marks,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
      ]
    );
    res.json({ message: "Question added", question: result.rows[0] });
  } catch (err) {
    console.error("Add question error:", err);
    return sendError(res, 500, "Error adding question");
  }
}
);

// -------------------------------------------------------
// PUBLISH QUIZ (teacher only)
// -------------------------------------------------------
router.post("/quizzes/:quizId/publish", verifyTeacher, async (req, res) => {
  const { quizId } = req.params;
  try {
    await pool.query(`UPDATE quizzes SET is_published = TRUE WHERE id = $1`, [
      quizId,
    ]);
    res.json({ message: "Quiz published successfully" });
  } catch (err) {
    console.error("Publish quiz error:", err);
    return sendError(res, 500, "Error publishing quiz");
  }
});

// -------------------------------------------------------
// GET ALL PUBLISHED QUIZZES
// -------------------------------------------------------
router.get("/quizzes", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM quizzes
       WHERE is_published = TRUE
       ORDER BY start_time ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch quizzes error:", err);
    return sendError(res, 500, "Error fetching quizzes");
  }
});

// -------------------------------------------------------
// JOIN / REGISTER FOR QUIZ (check registration) - authenticated users
// -------------------------------------------------------
router.post("/quizzes/:id/join", verifyUser, async (req, res) => {
  const quizId = req.params.id;
  const userId = req.user.user_id;

  try {
    // Check if user already registered
    const reg = await pool.query(
      `SELECT * FROM quiz_participants WHERE quiz_id = $1 AND user_id = $2`,
      [quizId, userId]
    );

    if (reg.rows.length === 0) {
      return res.json({ joined: false, message: "NOT_REGISTERED" });
    }

    // If registered → allow quiz attempt
    res.json({ joined: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error checking join status" });
  }
});

router.post("/quizzes/:id/check", verifyUser, async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      "SELECT * FROM quiz_participants WHERE quiz_id = $1 AND user_id = $2",
      [quizId, userId]
    );

    res.json({ registered: result.rows.length > 0 });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error checking registration status" });
  }
});

router.get("/quizzes/:id/status", async (req, res) => {
  const quizId = req.params.id;

  try {
    const quizRes = await pool.query(
      "SELECT start_time, end_time FROM quizzes WHERE id = $1",
      [quizId]
    );

    if (quizRes.rows.length === 0) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const quiz = quizRes.rows[0];
    const now = new Date();
    const start = new Date(quiz.start_time);
    const end = new Date(quiz.end_time);

    if (now < start) {
      return res.status(403).json({ message: "NOT_STARTED" });
    }

    if (now > end) {
      return res.status(410).json({ message: "ENDED" });
    }

    return res.json({ status: "ONGOING" });
  } catch (err) {
    console.error("Status check error:", err);
    return sendError(res, 500, "Server error");
  }
});

// -------------------------------------------------------
// GET QUIZ QUESTIONS FOR ATTEMPT
// -------------------------------------------------------
router.get("/quizzes/:quizId/attempt", async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const questions = await pool.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, marks
       FROM quiz_questions
       WHERE quiz_id = $1`,
      [quizId]
    );

    return res.json({
      success: true,
      questions: questions.rows,
    });
  } catch (err) {
    console.error("Error loading attempt questions:", err);
    return sendError(res, 500, "Server error");
  }
});

router.get("/quizzes/:id", async (req, res) => {
  try {
    const quizId = req.params.id;

    const quizRes = await pool.query(
      "SELECT * FROM quizzes WHERE id = $1",
      [quizId]
    );

    if (quizRes.rows.length === 0) {
      return sendError(res, 404, "Quiz not found");
    }

    const quiz = quizRes.rows[0];

    // Time checks
    const now = new Date();
    const start = new Date(quiz.start_time);
    const end = new Date(quiz.end_time);

    // ❌ Quiz not started yet
    if (now < start) {
      return sendError(res, 403, "Quiz has not started yet");
        quiz: {
          id: quiz.id,
          name: quiz.name,
          description: quiz.description,
          instructions: quiz.instructions,
          start_time: quiz.start_time,
          end_time: quiz.end_time
        }
      });
    }

    // ❌ Quiz ended
    if (now > end) {
      return sendError(res, 410, "Quiz has ended");
    }

    // If quiz is ongoing → return questions
    const qRes = await pool.query(
      "SELECT * FROM quiz_questions WHERE quiz_id = $1",
      [quizId]
    );

    res.json({
      id: quiz.id,
      name: quiz.name,
      description: quiz.description,
      instructions: quiz.instructions,
      questions: qRes.rows
    });

  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Server error");
  }
});


// -------------------------------------------------------
// SUBMIT QUIZ (authenticated users)
// -------------------------------------------------------
router.post(
  "/quizzes/:quizId/submit",
  verifyUser,
  [
    body("answers")
      .isArray({ min: 1 })
      .withMessage("Answers array is required"),
  ],
  handleValidationErrors,
  async (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body; // [{ question_id, selected_option }]
  const userId = req.user.user_id;

  try {
    // Fetch quiz questions
    const questionsRes = await pool.query(
      "SELECT * FROM quiz_questions WHERE quiz_id = $1",
      [quizId]
    );
    const questions = questionsRes.rows;

    // Calculate score
    let score = 0;
    answers.forEach((ans) => {
      const question = questions.find((q) => q.id === ans.question_id);
      if (question && question.correct_answer === ans.selected_option) {
        score += question.marks;
      }
    });

    // Insert/update result
    await pool.query(
      `INSERT INTO quiz_results (quiz_id, user_id, score, answered, total_questions)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (quiz_id, user_id)
       DO UPDATE SET score = $3, answered = $4, total_questions = $5`,
      [quizId, userId, score, answers.length, questions.length]
    );

    res.json({ message: "Quiz submitted", score });
  } catch (err) {
    console.error("Submit quiz error:", err);
    return sendError(res, 500, "Error submitting quiz");
  }
}
);

// -------------------------------------------------------
// GET QUIZ RESULTS
// -------------------------------------------------------
router.get("/quizzes/:quizId/results", async (req, res) => {
  const { quizId } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.user_name, qr.score, qr.answered, qr.total_questions
   FROM quiz_results qr
   JOIN users u ON u.user_id = qr.user_id
   WHERE qr.quiz_id = $1`,
      [quizId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch quiz results error:", err);
    return sendError(res, 500, "Error fetching quiz results");
  }
});

// -------------------------------------------------------
// QUIZ LEADERBOARD
// -------------------------------------------------------
router.get("/quizzes/:quizId/leaderboard", async (req, res) => {
  const { quizId } = req.params;
  try {
    const leaderboardRes = await pool.query(
      `SELECT u.user_id, u.user_name, qr.score
       FROM quiz_results qr
       JOIN users u ON qr.user_id = u.user_id
       WHERE qr.quiz_id = $1
       ORDER BY qr.score DESC`,
      [quizId]
    );
    res.json({ leaderboard: leaderboardRes.rows });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return sendError(res, 500, "Error fetching leaderboard");
  }
});

export default router;
