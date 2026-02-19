// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";

// export default function QuizDetails() {
//   const { id } = useParams();
//   const [quiz, setQuiz] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchQuiz = async () => {
//       try {
//         const res = await axios.get(
//           `http://localhost:4000/quiz/quizzes/${id}?includeQuestions=true`
//         );
//         setQuiz(res.data.quiz);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load quiz details");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchQuiz();
//   }, [id]);

//   if (loading) return <p className="text-white p-6">Loading...</p>;
//   if (error) return <p className="text-red-500 p-6">{error}</p>;
//   if (!quiz) return <p className="text-white p-6">Quiz not found</p>;

//   return (
//     <div className="min-h-screen bg-[#070B13] p-6 text-white">
//       <h1 className="text-2xl font-bold mb-4">{quiz.name}</h1>
//       <p className="mb-2 text-gray-300">{quiz.description}</p>
//       <p className="mb-4 text-gray-400">{quiz.instructions}</p>

//       {/* Questions */}
//       <div className="space-y-3 mb-4">
//         {quiz.questions?.map((q, idx) => (
//           <div key={q.question_id} className="bg-[#0C121E] p-3 rounded-lg">
//             <p className="font-medium">
//               {idx + 1}. {q.question_text} ({q.marks} marks)
//             </p>
//             <ul className="list-disc list-inside text-gray-300">
//               {q.options?.map((opt, i) => (
//                 <li key={i}>{opt.text}</li>
//               ))}
//             </ul>
//           </div>
//         ))}
//       </div>

//       {/* Edit Quiz Button (Unfunctional) */}
//       <button className="bg-green-600 px-4 py-2 rounded hover:bg-green-500">
//         Edit Quiz
//       </button>
//     </div>
//   );
// }