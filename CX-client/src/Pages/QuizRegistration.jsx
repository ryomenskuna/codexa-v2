import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/navbar";
import { UserContext } from "../context/userContext";

export default function QuizRegistration() {
  const { quizId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/quiz/quizzes/${quizId}`
        );
        setQuiz(res.data); // for ongoing quiz, res.data has id, name, description, etc.
      } catch (err) {
        if (err.response?.status === 403 || err.response?.status === 410) {
          // quiz not started yet OR quiz ended → show metadata
          setQuiz(err.response.data.quiz || null);
          alert(err.response.data.message); // optional
          return;
        }
        console.error(err);
        alert("Error loading quiz details");
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleRegister = async () => {
    if (!user) return alert("Please login first!");
    try {
      await axios.post(
        `http://localhost:4000/quiz/quizzes/${quizId}/register`,
        { user_id: user.user_id }
      );

      alert("Registered successfully!");

      navigate(`/quiz/${quizId}/attempt`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error registering");
    }
  };

  if (!quiz)
    return <p className="text-center text-gray-300 mt-10">Loading...</p>;

  return (
    <div className="bg-[#0D111A] min-h-screen p-2">
      <Navbar />
      <div className="max-w-3xl mx-auto mt-6 bg-[#0C121E] p-6 rounded-lg shadow-md">
        <h1 className="text-3xl text-white font-bold">{quiz.name}</h1>
        <p className="text-gray-300 mt-3">{quiz.description}</p>

        <h3 className="text-gray-400 mt-4 font-semibold">Instructions</h3>
        <p className="text-gray-300">{quiz.instructions}</p>

        <h3 className="text-gray-400 mt-4 font-semibold">Time</h3>
        <p className="text-gray-300">
          {new Date(quiz.start_time).toLocaleString()} —{" "}
          {new Date(quiz.end_time).toLocaleString()}
        </p>

        {quiz && new Date() >= new Date(quiz.start_time) ? (
          <button onClick={handleRegister} className="...">
            Register & Join
          </button>
        ) : (
          <p className="text-gray-400 mt-4">This quiz has not started yet</p>
        )}
      </div>
    </div>
  );
}