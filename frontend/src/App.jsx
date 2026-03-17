import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import QuizInterface from './pages/QuizInterface.jsx';
import QuizResults from './pages/QuizResults.jsx';
import ScoreHistory from './pages/ScoreHistory.jsx';
import ExamDashboard from './pages/ExamDashboard.jsx';
import ExamSimulator from './pages/ExamSimulator.jsx';
import ExamReport from './pages/ExamReport.jsx';
import Flashcards from './pages/Flashcards.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/quiz" element={<ProtectedRoute><QuizInterface /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
      <Route path="/scores" element={<ProtectedRoute><ScoreHistory /></ProtectedRoute>} />
      <Route path="/exams" element={<ProtectedRoute><ExamDashboard /></ProtectedRoute>} />
      <Route path="/exam-simulator/:attemptId" element={<ProtectedRoute><ExamSimulator /></ProtectedRoute>} />
      <Route path="/exam-report" element={<ProtectedRoute><ExamReport /></ProtectedRoute>} />
      <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
    </Routes>
  );
}
