import React, { useEffect, useState, useContext } from "react";
import Navbar from "../components/navbar";
import { UserContext } from "../context/userContext";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";

export default function QuizzesPage() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [tab, setTab] = useState("ongoing");
  const [quizzes, setQuizzes] = useState({
    ongoing: [],
    upcoming: [],
    past: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userResults, setUserResults] = useState({}); // quizId -> submitted?

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const quizzesData = await apiClient.get("/quiz/quizzes");

        const now = new Date();
        const categorized = { ongoing: [], upcoming: [], past: [] };

        quizzesData.forEach((quiz) => {
          const start = new Date(quiz.start_time);
          const end = new Date(quiz.end_time);

          if (now >= start && now <= end) categorized.ongoing.push(quiz);
          else if (now < start) categorized.upcoming.push(quiz);
          else categorized.past.push(quiz);
        });

        setQuizzes(categorized);

        // fetch user results to see which quizzes they already submitted
        if (user) {
          const res2 = await Promise.all(
            quizzesData.map(async (q) => {
              try {
                const result = await apiClient.get(
                  `/quiz/quizzes/${q.id}/results`
                );
                const submitted = result.some(
                  (r) => r.user_id === user.user_id
                );
                return { quizId: q.id, submitted };
              } catch {
                return { quizId: q.id, submitted: false };
              }
            })
          );
          const map = {};
          res2.forEach((r) => (map[r.quizId] = r.submitted));
          setUserResults(map);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [user]);

  const handleJoinQuiz = async (quizId) => {
    if (!user) {
      return alert("Please login first!");
    }

    try {
      const res = await apiClient.post(`/quiz/quizzes/${quizId}/check`, {});

      if (res.registered) {
        navigate(`/quiz/${quizId}/attempt`);
      } else {
        navigate(`/quiz/${quizId}/register`);
      }
    } catch (err) {
      console.error(err);
      navigate(`/quiz/${quizId}/register`);
    }
  };

  const handleViewResults = (quizId) => {
    navigate(`/quiz/${quizId}/results`);
  };

  return (
    <div className="bg-[#0D111A] p-2 text-white">
      <div className="min-h-screen bg-[#070B13] rounded-lg shadow-black shadow-md">
        <Navbar />
        <div className="bg-[#070B13] px-4 md:px-10 pb-10">
          {/* --- Top Cards --- */}
          <div className="flex flex-col md:flex-row justify-evenly items-center p-4 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-[#0C121E] rounded-lg shadow-lg w-full md:w-1/3 min-h-[240px] md:min-h-[280px] m-2"
              >
                <div>
                  <img
                    src="https://assets.leetcode.com/contest-config/contest/wc_card_img.png"
                    alt="Contest"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex items-center lc-md:min-h-[84px] min-h-[80px] px-4">
                  Hello
                </div>
              </div>
            ))}
          </div>

          {/* --- Tabs + Quiz List Section --- */}
          <div className="flex flex-col md:flex-row min-h-52 p-4 gap-x-2">
            <div className="h-[780px] w-full md:w-3/4 bg-[#0C121E] rounded-lg shadow-lg">
              {/* Tabs */}
              <div className="flex w-full items-center justify-between px-4 pr-8 py-2">
                <div className="flex gap-4">
                  {["ongoing", "upcoming", "past"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`w-32 p-2 rounded-md font-medium transition ${
                        tab === t
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                {user?.role === "teacher" && (
                  <Link
                    to="/create-quiz"
                    className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-md text-white font-medium hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all"
                  >
                    Create Quiz
                  </Link>
                )}
              </div>

              {/* Quiz List */}
              <div className="overflow-y-scroll px-4 py-2 space-y-4">
                {loading ? (
                  <p className="text-gray-400 text-center py-10">
                    Loading quizzes...
                  </p>
                ) : error ? (
                  <p className="text-red-500 text-center py-10">{error}</p>
                ) : quizzes[tab].length === 0 ? (
                  <p className="text-gray-400 text-center py-10">
                    No {tab} quizzes found
                  </p>
                ) : (
                  quizzes[tab].map((q) => {
                    const formattedDate = new Date(q.start_time).toLocaleString(
                      "en-IN",
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }
                    );

                    const submitted = userResults[q.id];
                    let actionBtn;

                    if (tab === "ongoing") {
                      actionBtn = submitted ? (
                        <button
                          className="w-28 px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white font-medium"
                          onClick={() => handleViewResults(q.id)}
                        >
                          View Results
                        </button>
                      ) : (
                        <button
                          className="w-28 px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white font-medium"
                          onClick={() => handleJoinQuiz(q.id)}
                        >
                          Join Quiz
                        </button>
                      );
                    } else if (tab === "upcoming") {
                      actionBtn = (
                        <button className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium"
                          onClick={() => handleJoinQuiz(q.id)}
                        >
                          Register
                        </button>
                      );
                    } else {
                      actionBtn = (
                        <button
                          className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white font-medium"
                          onClick={() => handleViewResults(q.id)}
                        >
                          View Results
                        </button>
                      );
                    }

                    return (
                      <div
                        key={q.id}
                        className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-2 shadow-sm hover:shadow-lg transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-10 bg-gradient-to-tr from-[#0b1220] to-[#0f172a] rounded-md flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M12 6v6l4 2"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-2xl text-white font-semibold">
                              {q.name}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {formattedDate}
                            </p>
                          </div>
                        </div>
                        <div>{actionBtn}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className="flex flex-col h-[750px] md:w-1/4 bg-transparent gap-5">
              {/* Global Leaderboard */}
              <div className="flex flex-col h-1/2 w-full bg-gray-900 rounded-lg shadow-lg">
                <h2 className="text-white text-xl font-bold p-3">
                  Global Leaderboard
                </h2>
                <div className="flex flex-col overflow-y-scroll gap-y-3 px-2">
                  {/* Hardcoded leaderboard for now */}
                  <div className="h-2" />
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-semibold w-6">{i}</div>
                        <div className="text-gray-200 font-medium">
                          Player {i}
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">
                        {1000 - i * 50} pts
                      </div>
                    </div>
                  ))}
                  <div className="h-6" />
                </div>
              </div>

              {/* Virtual Leaderboard */}
              <div className="flex flex-col h-1/2 w-full bg-gray-900 rounded-lg shadow-lg">
                <h2 className="text-white text-xl font-bold p-3">
                  Virtual Leaderboard
                </h2>
                <div className="flex flex-col overflow-y-scroll gap-y-3 px-2">
                  <div className="h-2" />
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-semibold w-6">{i}</div>
                        <div className="text-gray-200 font-medium">
                          Player {i}
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">
                        {1000 - i * 50} pts
                      </div>
                    </div>
                  ))}
                  <div className="h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
