import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import { UserContext } from "../context/userContext";
import axios from "axios";

export default function QuizAttempt() {
  const { quizId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [quizMeta, setQuizMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);

      try {
        // Get quiz metadata + questions in one call
        const res = await axios.get(`http://localhost:4000/quiz/quizzes/${quizId}`);
        const data = res.data;

        // Time checks (optional, if backend doesn't handle)
        const now = new Date();
        const start = new Date(data.start_time);
        const end = new Date(data.end_time);

        if (now < start) return alert("Quiz has not started yet!");
        if (now > end) return alert("Quiz has ended!");

        // Set metadata
        setQuizMeta({
          id: data.id,
          name: data.name,
          description: data.description,
          instructions: data.instructions,
          start_time: data.start_time,
          end_time: data.end_time,
        });

        // Set questions
        setQuestions(
          (data.questions || []).map((q) => ({
            id: q.id,
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            marks: q.marks,
          }))
        );

      } catch (err) {
        console.error(err);
        alert("Error loading quiz");
      }

      setLoading(false); // ✅ Always turn off loading
    };

    fetchQuiz();
  }, [quizId]);

  const handleSelect = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = async () => {
    if (!user) return alert("Please login first!");
    if (Object.keys(answers).length === 0) return alert("Please answer at least one question");

    const answersArray = Object.entries(answers).map(([qId, selected_option]) => ({
      question_id: parseInt(qId, 10),
      selected_option,
    }));

    const payload = { user_id: user.user_id, answers: answersArray };

    try {
      const res = await axios.post(`http://localhost:4000/quiz/quizzes/${quizId}/submit`, payload);
      alert(`Quiz submitted! Your score: ${res.data.score}`);
      navigate(`/quiz/${quizId}/results`);
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || "Error submitting quiz");
    }
  };

  if (loading)
    return <p className="text-gray-400 text-center mt-10">Loading quiz...</p>;
  if (!quizMeta)
    return <p className="text-gray-400 text-center mt-10">Quiz not found.</p>;

  return (
    <div className="bg-[#0D111A] min-h-screen p-2">
      <Navbar />
      <div className="max-w-4xl mx-auto bg-[#0C121E] rounded-lg shadow-md p-6 mt-6">
        <h1 className="text-3xl text-white font-bold mb-2">{quizMeta.name}</h1>
        <p className="text-gray-300 mb-4">{quizMeta.description}</p>

        {questions.map((q, idx) => (
          <div key={q.id} className="mb-6">
            <h3 className="text-white font-semibold mb-2">
              {idx + 1}. {q.question_text} ({q.marks} pts)
            </h3>

            <div className="flex flex-col gap-2">
              {["A", "B", "C", "D"].map((opt) => (
                <label
                  key={`${q.id}-${opt}`}
                  className="text-gray-300 flex items-center gap-2"
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => handleSelect(q.id, opt)}
                  />
                  <span>{q[`option_${opt.toLowerCase()}`]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md"
          onClick={handleSubmit}
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
}