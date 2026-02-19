import React from "react";

export default function PreviewModal({ quiz, onClose }) {
  if (!quiz) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      {/* stop propagation so clicking inside modal doesn't close */}
      <div
        className="bg-[#0C121E] text-white rounded-lg w-full max-w-3xl shadow-xl
                   max-h-[90vh] overflow-y-auto transform transition-transform duration-300
                   ease-out scale-100"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn .18s ease-out" }}
      >
        {/* sticky header */}
        <div className="sticky top-0 z-10 bg-[#0C121E]/95 backdrop-blur-sm px-6 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">Preview Quiz</h2>
          <button
            aria-label="Close preview"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all text-2xl"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4">
          {/* DETAILS */}
          <div className="mb-4">
            <p className="text-lg font-semibold">{quiz.name}</p>
            <p className="text-gray-300 mb-1">{quiz.description}</p>
            <p className="text-gray-400 text-sm">{quiz.instructions}</p>
          </div>

          {/* QUESTIONS */}
          <div className="space-y-3">
            {quiz?.questions?.map((q, i) => (
              <div key={q.id ?? q.question_id ?? i} className="bg-[#0b1220] p-3 rounded">
                <p className="font-medium mb-2">
                  {i + 1}. {q.text ?? q.question}{" "}
                  <span className="text-cyan-400 text-sm">({q.marks} marks)</span>
                </p>

                <div className="ml-3 grid gap-2">
                  { (q.options || [
                    { text: q.option_a, isCorrect: q.correct_answer === "A" },
                    { text: q.option_b, isCorrect: q.correct_answer === "B" },
                    { text: q.option_c, isCorrect: q.correct_answer === "C" },
                    { text: q.option_d, isCorrect: q.correct_answer === "D" },
                  ]).map((opt, idx) => {
                    const isCorrect = !!opt.isCorrect;
                    return (
                      <p
                        key={idx}
                        className={`p-2 rounded transition-all duration-200
                          ${isCorrect ? "bg-green-800 text-green-200 scale-[1.01]" : "bg-[#0f172a] text-gray-300"}`}
                      >
                        <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>
                        <span>{opt.text}</span>
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* CLOSE BUTTON */}
          <div className="flex justify-end mt-4 pb-6 px-1">
            <button onClick={onClose} className="bg-red-600 px-4 py-2 rounded hover:brightness-110 transition">
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(6px) scale(.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}