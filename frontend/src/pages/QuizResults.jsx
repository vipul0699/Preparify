import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { quizApi } from '../services/api';

export default function QuizResults() {
  const location = useLocation();
  const { results = [], topic = 'Quiz', quizId } = location.state || {};
  const { user } = useAuth();
  
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (results.length > 0) {
      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      if (avgScore >= 80) {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      }
    }
  }, [results]);

  const handleGenerateAnalysis = async () => {
    if (!quizId) return;
    setLoadingAnalysis(true);
    try {
      const data = await quizApi.getGapAnalysis(quizId);
      setAnalysis(data);
    } catch (err) {
      console.error("Failed to generate analysis:", err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!quizId) return;
    setDownloading(true);
    try {
      const res = await quizApi.downloadReport(quizId);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Preparify_Report_${quizId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to download report:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (!results.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f8] font-[Inter]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 block">assessment</span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No results to show</h2>
          <Link to="/dashboard" className="text-primary font-bold hover:underline">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  const totalScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  const correctCount = results.filter((r) => r.is_correct).length;

  return (
    <div className="bg-[#f6f6f8] font-[Inter] text-slate-900 min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-40 py-3 sticky top-0 z-50">
        <Link to="/dashboard" className="flex items-center gap-4">
          <div className="size-8 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48"><path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" /></svg>
          </div>
          <h2 className="text-slate-900 text-lg font-bold tracking-[-0.015em]">Preparify</h2>
        </Link>
        <div className="flex gap-6 items-center">
          <Link to="/dashboard" className="text-slate-600 text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
          <Link to="/scores" className="text-slate-600 text-sm font-medium hover:text-primary transition-colors">Score History</Link>
        </div>
      </header>

      <main className="flex-1 flex justify-center py-8 px-6 lg:px-40">
        <div className="max-w-[960px] flex-1 flex flex-col gap-8">
          {/* Summary */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-8 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col gap-2">
              <nav className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>Quiz Completed</span>
              </nav>
              <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-[-0.033em]">{topic}</h1>
              <p className="text-slate-500 text-lg">Detailed performance analysis and AI-driven insights.</p>
            </div>
            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              <div className="flex-1 lg:min-w-[160px] flex flex-col gap-1 rounded-xl p-5 bg-primary/5 border border-primary/10">
                <p className="text-primary text-xs font-bold uppercase tracking-wider">Total Score</p>
                <p className="text-slate-900 text-3xl font-black">{totalScore}<span className="text-slate-400 text-xl font-normal">/100</span></p>
              </div>
              <div className="flex-1 lg:min-w-[160px] flex flex-col gap-1 rounded-xl p-5 bg-green-500/5 border border-green-500/10">
                <p className="text-green-600 text-xs font-bold uppercase tracking-wider">Accuracy</p>
                <p className="text-slate-900 text-3xl font-black">{correctCount}<span className="text-slate-400 text-xl font-normal">/{results.length} Correct</span></p>
              </div>
            </div>
          </div>

          {/* Gap Analysis Section for Pro Users */}
          {user?.is_paid && (
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Pro Feature</span>
                    <span className="material-symbols-outlined text-yellow-300">auto_awesome</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">AI Gap Analysis</h2>
                  <p className="text-primary-foreground/80 text-sm max-w-md mt-1">
                    Get a deep conceptual breakdown of your performance and a structured study focus list.
                  </p>
                </div>
                {!analysis ? (
                  <button 
                    onClick={handleGenerateAnalysis}
                    disabled={loadingAnalysis}
                    className="bg-white text-primary font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loadingAnalysis ? (
                      <><span className="animate-spin material-symbols-outlined">sync</span> Generating...</>
                    ) : (
                      <><span className="material-symbols-outlined">analytics</span> Generate Report</>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={handleDownloadReport}
                    disabled={downloading}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {downloading ? (
                      <><span className="animate-spin material-symbols-outlined">sync</span> Preparing...</>
                    ) : (
                      <><span className="material-symbols-outlined">download</span> Download PDF</>
                    )}
                  </button>
                )}
              </div>

              {analysis && (
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">psychology</span> Conceptual Breakdown
                    </h3>
                    <p className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">{analysis.gap_analysis}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">assignment</span> Study Focus List
                    </h3>
                    <ul className="space-y-3">
                      {analysis.study_focus.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-white/90">
                          <span className="mt-1 size-1.5 rounded-full bg-yellow-300 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Non-Pro User Teaser */}
          {!user?.is_paid && (
            <div className="bg-slate-100 rounded-2xl p-8 border-2 border-dashed border-slate-300 flex flex-col items-center text-center gap-4">
              <span className="material-symbols-outlined text-4xl text-slate-400">lock</span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Unlock Deep Insights</h3>
                <p className="text-slate-500 text-sm max-w-sm mt-1">Upgrade to Pro to get AI-powered Gap Analysis reports and personalized study plans after every quiz.</p>
              </div>
              <button className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition-all">Upgrade to Pro</button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-all">
              <span className="material-symbols-outlined">restart_alt</span> Take Another Quiz
            </Link>
            <Link to="/dashboard" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-lg transition-all">
              <span className="material-symbols-outlined">dashboard</span> Back to Dashboard
            </Link>
            <Link to="/scores" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-lg transition-all">
              <span className="material-symbols-outlined">history</span> Score History
            </Link>
          </div>

          {/* Detailed Breakdown */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <h2 className="text-slate-900 text-2xl font-bold tracking-[-0.015em]">Detailed Breakdown</h2>
              <div className="h-[1px] flex-1 bg-slate-200" />
            </div>
            <div className="space-y-6">
              {results.map((r, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {r.questionNumber || i + 1}</span>
                      <h3 className="text-lg font-bold text-slate-900">{r.questionText || `Question ${i + 1}`}</h3>
                    </div>
                    <span className={`flex items-center justify-center size-10 rounded-full ${r.is_correct ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                      <span className="material-symbols-outlined font-bold">{r.is_correct ? 'check' : 'close'}</span>
                    </span>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-slate-500 mb-2">Your Answer:</p>
                    <div className={`p-3 rounded-lg font-medium ${r.is_correct ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                      {r.user_answer}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-lg border-l-4 border-primary">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <span className="material-symbols-outlined text-[20px]">psychology</span>
                      <span className="text-sm font-bold uppercase tracking-wider">AI Feedback</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-3">{r.feedback}</p>
                    
                    {r.explanation && (
                      <div className="mt-4 pt-4 border-t border-primary/10">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">Deep Dive Explanation</span>
                        <p className="text-xs text-slate-700 leading-relaxed italic">"{r.explanation}"</p>
                      </div>
                    )}
                    
                    <p className="mt-3 text-[10px] font-bold text-slate-400">Score Impact: {r.score}/100</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="mt-8 mb-12 flex flex-col items-center gap-4 text-slate-400">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <p className="text-xs uppercase tracking-widest font-bold">Results recorded on {new Date().toLocaleDateString()}</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
