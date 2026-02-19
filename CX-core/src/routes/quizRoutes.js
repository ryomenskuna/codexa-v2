import express from "express";
import pool from "../db.js";

const router = express.Router();

// -------------------------------------------------------
// CREATE QUIZ
// -------------------------------------------------------
router.post("/quizzes", async (req, res) => {
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
    res.status(500).json({ message: "Error creating quiz" });
  }
});

// REGISTER for a quiz (for upcoming quizzes)
router.post("/quizzes/:id/register", async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  const { user_id } = req.body;

  try {
    // Check if already registered
    const check = await pool.query(
      `SELECT * FROM quiz_participants WHERE quiz_id = $1 AND user_id = $2`,
      [quizId, user_id]
    );

    if (check.rows.length > 0) {
      return res.json({ registered: true, message: "Already registered" });
    }

    // Register new participant
    await pool.query(
      `INSERT INTO quiz_participants (quiz_id, user_id) VALUES ($1, $2)`,
      [quizId, user_id]
    );

    return res.json({ registered: true, message: "Registration successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error registering for quiz" });
  }
});

// -------------------------------------------------------
// ADD QUESTION
// -------------------------------------------------------
router.post("/quizzes/:quizId/questions", async (req, res) => {
  const { quizId } = req.params;
  const { question, marks, options } = req.body;

  const option_a = options[0]?.text || "";
  const option_b = options[1]?.text || "";
  const option_c = options[2]?.text || "";
  const option_d = options[3]?.text || "";

  const correct_index = options.findIndex((o) => o.isCorrect);
  const correct_answer = ["A", "B", "C", "D"][correct_index];

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
    res.status(500).json({ message: "Error adding question" });
  }
});

// -------------------------------------------------------
// PUBLISH QUIZ
// -------------------------------------------------------
router.post("/quizzes/:quizId/publish", async (req, res) => {
  const { quizId } = req.params;
  try {
    await pool.query(`UPDATE quizzes SET is_published = TRUE WHERE id = $1`, [
      quizId,
    ]);
    res.json({ message: "Quiz published successfully" });
  } catch (err) {
    console.error("Publish quiz error:", err);
    res.status(500).json({ message: "Error publishing quiz" });
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
    res.status(500).json({ message: "Error fetching quizzes" });
  }
});

// -------------------------------------------------------
// JOIN / REGISTER FOR QUIZ
// -------------------------------------------------------
router.post("/quizzes/:id/join", async (req, res) => {
  const quizId = req.params.id;
  const { user_id } = req.body;

  try {
    // Check if user already registered
    const reg = await pool.query(
      `SELECT * FROM quiz_participants WHERE quiz_id = $1 AND user_id = $2`,
      [quizId, user_id]
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

router.post("/quizzes/:id/check", async (req, res) => {
  const quizId = parseInt(req.params.id, 10);
  const { user_id } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM quiz_participants WHERE quiz_id = $1 AND user_id = $2",
      [quizId, user_id]
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
    return res.status(500).json({ message: "Server error" });
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
    return res.status(500).json({ message: "Server error" });
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
      return res.status(404).json({ message: "Quiz not found" });
    }

    const quiz = quizRes.rows[0];

    // Time checks
    const now = new Date();
    const start = new Date(quiz.start_time);
    const end = new Date(quiz.end_time);

    // ❌ Quiz not started yet
    if (now < start) {
      return res.status(403).json({
        message: "Quiz has not started yet",
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
      return res.status(410).json({
        message: "Quiz has ended"
      });
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
    res.status(500).json({ error: "Server error" });
  }
});


// -------------------------------------------------------
// SUBMIT QUIZ
// -------------------------------------------------------
router.post("/quizzes/:quizId/submit", async (req, res) => {
  const { quizId } = req.params;
  const { user_id, answers } = req.body; // [{ question_id, selected_option }]

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: "Answers array is required" });
  }

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
      [quizId, user_id, score, answers.length, questions.length]
    );

    res.json({ message: "Quiz submitted", score });
  } catch (err) {
    console.error("Submit quiz error:", err);
    res.status(500).json({ message: "Error submitting quiz" });
  }
});

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
    res.status(500).json({ message: "Error fetching quiz results" });
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
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
});

export default router;
