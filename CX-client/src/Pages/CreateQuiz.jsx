import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PreviewModal from "../components/PreviewModal";

export default function CreateQuiz() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [starttime, setStartTime] = useState("");
  const [endtime, setEndTime] = useState("");

  const [questions, setQuestions] = useState([]);
  const [previewQuiz, setPreviewQuiz] = useState(null);

  function toPostgresTimestamp(localDateTime) {
    return localDateTime.replace("T", ":") + ":00";
  }

  // Add a new question
  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "",
        marks: 1,
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const updateQuestion = (qid, updater) => {
    setQuestions((prev) => prev.map((q) => (q.id === qid ? updater(q) : q)));
  };

  const totalMarks = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  // for (let q of questions) {
  //   const hasCorrect = q.options.some((opt) => opt.isCorrect);
  //   if (!hasCorrect) return alert("Each question must have one correct option");
  // }

  // PUBLISH QUIZ
  const handlePublish = async () => {
    if (!user) return alert("Login required");

    if (!name || !starttime || !endtime || questions.length === 0) {
      return alert("Please fill all fields and add at least one question.");
    }

    try {
      // 1️⃣ Create Quiz
      const res = await axios.post("http://localhost:4000/quiz/quizzes", {
        name,
        description,
        instructions,
        start_time: toPostgresTimestamp(starttime),
        end_time: toPostgresTimestamp(endtime),
        created_by: user.user_id,
        is_published: false,
      });

      const quizId = res.data.quiz.id;

      // 2️⃣ Add Questions
      for (let q of questions) {
        await axios.post(
          `http://localhost:4000/quiz/quizzes/${quizId}/questions`,
          {
            question: q.text,
            marks: q.marks,
            options: q.options,
          }
        );
      }

      // 3️⃣ Publish quiz
      await axios.post(`http://localhost:4000/quiz/quizzes/${quizId}/publish`);

      alert("Quiz Published Successfully!");
      navigate("/quizzes");
    } catch (err) {
      console.error("Publish Error:", err);
      alert("Failed to publish quiz");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#070B13] text-white">
      <h1 className="text-2xl font-bold mb-4">Create Quiz</h1>

      {/* QUIZ DETAILS */}
      <div className="bg-[#0C121E] p-4 rounded-lg shadow mb-4">
        <input
          className="w-full p-3 mb-3 rounded bg-[#0b1220]"
          placeholder="Quiz Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          className="w-full p-3 mb-3 rounded bg-[#0b1220] h-28"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <textarea
          className="w-full p-3 mb-3 rounded bg-[#0b1220] h-24"
          placeholder="Instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        <div className="flex gap-3 mb-3">
          <input
            type="datetime-local"
            value={starttime}
            onChange={(e) => setStartTime(e.target.value)}
            className="p-2 rounded bg-[#0b1220]"
          />

          <input
            type="datetime-local"
            value={endtime}
            onChange={(e) => setEndTime(e.target.value)}
            className="p-2 rounded bg-[#0b1220]"
          />
        </div>
      </div>

      {/* QUESTIONS */}
      <div className="bg-[#0C121E] p-4 rounded-lg shadow mb-4">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Questions</h2>
          <span className="text-cyan-400">Total Marks: {totalMarks}</span>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} className="bg-[#0b1220] p-3 rounded mb-3">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Question {idx + 1}</span>

              <input
                type="number"
                min="1"
                value={q.marks}
                onChange={(e) =>
                  updateQuestion(q.id, (cur) => ({
                    ...cur,
                    marks: Number(e.target.value),
                  }))
                }
                className="w-20 p-1 rounded bg-[#0f172a]"
              />
            </div>

            <input
              type="text"
              placeholder="Question text"
              value={q.text}
              onChange={(e) =>
                updateQuestion(q.id, (cur) => ({
                  ...cur,
                  text: e.target.value,
                }))
              }
              className="w-full p-2 mb-2 rounded bg-[#0f172a]"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={opt.isCorrect}
                    onChange={() =>
                      updateQuestion(q.id, (cur) => ({
                        ...cur,
                        options: cur.options.map((o, ii) => ({
                          ...o,
                          isCorrect: ii === i,
                        })),
                      }))
                    }
                  />
                  <input
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt.text}
                    onChange={(e) =>
                      updateQuestion(q.id, (cur) => ({
                        ...cur,
                        options: cur.options.map((o, ii) =>
                          ii === i ? { ...o, text: e.target.value } : o
                        ),
                      }))
                    }
                    className="flex-1 p-2 rounded bg-[#0f172a]"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button onClick={addQuestion} className="bg-cyan-600 px-4 py-2 rounded">
          + Add Question
        </button>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() =>
            setPreviewQuiz({
              name,
              description,
              instructions,
              questions,
            })
          }
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Preview
        </button>
        <PreviewModal quiz={previewQuiz} onClose={() => setPreviewQuiz(null)} />
        <button
          onClick={handlePublish}
          className="bg-green-600 px-4 py-2 rounded"
        >
          Publish
        </button>
      </div>
    </div>
  );
}
