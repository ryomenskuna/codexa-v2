import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../context/userContext";
import Navbar from "../components/navbar";
import axios from "axios";

export default function QuizResults() {
  const { quizId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [score, setScore] = useState(null);
  const [total, setTotal] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/quiz/quizzes/${quizId}/results`
        );

        // backend returns rows with: user_id, user_name, score, answered, total_questions
        // find current user's result (user might be null)
        const userResult = user ? res.data.find((r) => r.user_id === user.user_id) : null;
        if (userResult) {
          setScore(userResult.score);
          setTotal(userResult.total_questions);
        } else {
          setScore(null);
          setTotal(null);
        }

        const sorted = [...res.data].sort((a, b) => b.score - a.score);
        setLeaderboard(sorted);
      } catch (err) {
        console.error(err);
      }
    };

    fetchResults();
  }, [quizId, user]);

  return (
    <div className="bg-[#0D111A] min-h-screen p-2">
      <Navbar />

      <div className="max-w-4xl mx-auto bg-[#0C121E] rounded-lg shadow-md p-6 mt-6">
        <h1 className="text-3xl font-bold text-white mb-4">Quiz Results</h1>

        {score !== null ? (
          <div className="mb-6">
            <p className="text-xl text-gray-300">
              Your Score: <span className="font-semibold text-green-400">{score}</span> /{" "}
              {total}
            </p>
          </div>
        ) : (
          <p className="text-gray-400">No results found for you.</p>
        )}

        <h2 className="text-2xl font-semibold text-white mb-4">Leaderboard</h2>
        <div className="space-y-2">
          {leaderboard.map((p, index) => (
            <div
              key={p.user_id}
              className={`flex justify-between p-2 rounded-md ${
                user && p.user_id === user.user_id ? "bg-green-700 text-white" : "bg-gray-800 text-gray-300"
              }`}
            >
              <span>{index + 1}. {p.user_name}</span>
              <span>{p.score} pts</span>
            </div>
          ))}
        </div>

        <button
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md"
          onClick={() => navigate("/quizzes")}
        >
          Back to Quizzes
        </button>
      </div>
    </div>
  );
}