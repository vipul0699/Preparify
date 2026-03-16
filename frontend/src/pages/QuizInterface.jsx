import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { quizApi } from '../services/api';

export default function QuizInterface() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizId, questions = [], topic = '', difficulty = '' } = location.state || {};

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [results, setResults] = useState([]);
  const [zenMode, setZenMode] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f8] font-[Inter]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">quiz</span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No quiz loaded</h2>
          <Link to="/dashboard" className="text-primary font-bold hover:underline">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  const question = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const handleSubmit = async () => {
    if (!currentAnswer.trim()) return;
    setSubmitting(true);
    try {
      const result = await quizApi.submit(question.id, currentAnswer);
      setCurrentResult(result);
      setShowFeedback(true);
      setAnswers({ ...answers, [question.id]: currentAnswer });
      
      const newResults = [...results, { ...result, questionText: question.text, questionNumber: currentIdx + 1, explanation: question.explanation }];
      setResults(newResults);
    } catch {
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setCurrentResult(null);
    setShowExplanation(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setCurrentAnswer('');
    } else {
      navigate('/results', { state: { results, topic, quizId } });
    }
  };

  const handleSkip = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setCurrentAnswer('');
    }
  };

  const difficultyIcons = { Easy: 'signal_cellular_alt_1_bar', Medium: 'signal_cellular_alt', Hard: 'signal_cellular_alt' };

  return (
    <div className="bg-[#f6f6f8] font-[Inter] text-slate-900 min-h-screen flex flex-col">
      {!zenMode && (
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 lg:px-40 animate-in slide-in-from-top duration-500">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
              <span className="material-symbols-outlined text-xl">terminal</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Preparify</h2>
          </Link>
          <div className="flex gap-2">
            <button onClick={() => setZenMode(true)} className="flex items-center justify-center rounded-lg h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all text-xs font-bold gap-2">
              <span className="material-symbols-outlined text-sm">visibility_off</span> Zen Mode
            </button>
            <Link to="/dashboard" className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-slate-600">close</span>
            </Link>
          </div>
        </header>
      )}

      {zenMode && (
        <button 
          onClick={() => setZenMode(false)}
          className="fixed top-6 right-6 z-50 size-12 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center text-slate-400 hover:text-primary transition-all hover:scale-110"
          title="Exit Zen Mode"
        >
          <span className="material-symbols-outlined">visibility</span>
        </button>
      )}

      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-3xl px-6 py-8 flex flex-col gap-8">
          {/* Progress */}
          <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Progress</h3>
                <p className="text-lg font-bold">Question {currentIdx + 1} of {questions.length}</p>
              </div>
              <p className="text-sm font-medium text-primary">{Math.round(progress)}% Completed</p>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5">
              <span className="material-symbols-outlined text-primary text-lg">code</span>
              <span className="text-sm font-semibold text-primary">{topic}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5">
              <span className="material-symbols-outlined text-amber-500 text-lg">{difficultyIcons[difficulty] || 'signal_cellular_alt'}</span>
              <span className="text-sm font-semibold text-slate-700">{difficulty} Difficulty</span>
            </div>
          </div>

          {/* Question Card */}
          <div className={`bg-white rounded-xl border p-8 shadow-sm transition-all duration-500 ${showFeedback ? 'border-primary/50' : 'border-slate-200'}`}>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-8">{question.text}</h1>
            
            {!showFeedback ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-500" htmlFor="answer">Your Written Answer</label>
                <textarea
                  id="answer"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 text-slate-900 focus:border-primary focus:ring-primary transition-all p-4 text-lg"
                  placeholder="Type your answer here..."
                  rows={6}
                />
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  Answer will be analyzed for accuracy and technical terminology.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className={`p-6 rounded-xl border-2 ${currentResult.is_correct ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`material-symbols-outlined ${currentResult.is_correct ? 'text-green-500' : 'text-red-500'}`}>
                      {currentResult.is_correct ? 'check_circle' : 'cancel'}
                    </span>
                    <h4 className={`font-black uppercase tracking-tight ${currentResult.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                      {currentResult.is_correct ? 'Correct Answer!' : 'Needs Improvement'}
                    </h4>
                    <span className="ml-auto text-2xl font-black text-slate-900">{currentResult.score}/100</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">"{currentAnswer}"</p>
                  <div className="mt-4 p-4 bg-white/50 rounded-lg border border-white/50 text-xs text-slate-600">
                    <span className="font-bold block mb-1">Feedback:</span>
                    {currentResult.feedback}
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="flex items-center gap-2 text-primary font-bold text-sm hover:underline transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">{showExplanation ? 'visibility_off' : 'auto_awesome'}</span>
                    {showExplanation ? 'Hide Explanation' : 'Explain Why?'}
                  </button>
                  
                  {showExplanation && (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-sm text-slate-700 leading-relaxed animate-in slide-in-from-top-2 duration-300">
                      {question.explanation || "AI Explanation is pending..."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            {!showFeedback ? (
              <>
                <button onClick={handleSkip} disabled={currentIdx >= questions.length - 1} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40">
                  <span className="material-symbols-outlined">skip_next</span> Skip Question
                </button>
                <button onClick={handleSubmit} disabled={submitting || !currentAnswer.trim()} className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                  {!submitting && <span className="material-symbols-outlined">arrow_forward</span>}
                </button>
              </>
            ) : (
              <button onClick={handleNext} className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3 rounded-xl bg-slate-900 text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-slate-900/20 ml-auto">
                {currentIdx < questions.length - 1 ? 'Next Question' : 'View Results'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="px-6 py-8 lg:px-40 text-center">
        <p className="text-xs text-slate-400">© 2024 Preparify Learning Systems. Focused Mode Active.</p>
      </footer>
    </div>
  );
}
