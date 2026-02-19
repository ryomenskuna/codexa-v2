import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeLayout from "./layouts/HomeLayout";
import { AuthProvider } from "./context/authContext";
import { UserProvider } from "./context/userContext";
import ProblemPage from "./Pages/editor";
import ProfilePage from "./Pages/Profilepage";
import ContestsPage1 from "./Pages/contest1";
import ProtectedRoute from "./components/ProtectedRoute";
import { Navigate } from "react-router-dom";
import CreateContestPage from "./Pages/CreateContestPage";
import CreateQuestionPage from "./Pages/CreateQuestionPage";
import Events from "./Pages/Events";
import Quizzes from "./Pages/Quizzes";
import CreateQuiz from "./Pages/CreateQuiz";
import QuizAttempt from "./Pages/QuizAttempt";
import QuizResults from "./Pages/QuizResults";
import QuizRegistration from "./Pages/QuizRegistration";

function App() {
  return (
    <UserProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route path="/home" element={<HomeLayout />} />
            <Route path="/create-contest" element={<CreateContestPage />} />
            <Route path="/create-quiz" element={<CreateQuiz />} />
            <Route path="/create-question" element={<CreateQuestionPage />} />
            <Route path="/events" element={<Events />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/quiz/:quizId/register" element={<QuizRegistration />} />
            <Route path="/quiz/:quizId/attempt" element={<QuizAttempt />} />
            <Route path="/quiz/:quizId/results" element={<QuizResults />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/contests"
              element={
                <ProtectedRoute>
                  <ContestsPage1 />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>

        {/* <ProblemPage />; */}
        {/* <ProfilePage /> */}
        {/* <HomeLayout /> */}
        {/* <ContestRegisterPage /> */}
        {/* <HomeLayout />; */}
        {/* <ContestsPage1 />; */}
        {/* <ProblemPage />; */}
      </AuthProvider>
    </UserProvider>
  );
}

export default App;
