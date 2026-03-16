import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ScoreHistory() {
  const { logout } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    authApi.getScores()
      .then(setScores)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = scores.filter((s) =>
    s.topic.toLowerCase().includes(search.toLowerCase())
  );

  const avgScore = scores.length ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length) : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500';
    if (score >= 60) return 'text-primary bg-primary';
    if (score >= 40) return 'text-amber-500 bg-amber-500';
    return 'text-red-500 bg-red-500';
  };

  return (
    <div className="bg-[#f6f6f8] font-[Inter] text-slate-900 min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 md:px-10 py-3 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-4">
          <div className="size-8 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48"><path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" /></svg>
          </div>
          <h2 className="text-slate-900 text-xl font-bold tracking-tight">Preparify</h2>
        </Link>
        <div className="flex flex-1 justify-end gap-4 md:gap-8 items-center">
          <nav className="hidden md:flex gap-6 items-center">
            <Link to="/dashboard" className="text-slate-600 hover:text-primary transition-colors text-sm font-medium">Dashboard</Link>
            <span className="text-primary font-bold text-sm">Score History</span>
          </nav>
          <button onClick={logout} className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-10 py-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tight">Your Learning Journey</h1>
            <p className="text-slate-500 text-base">Track your progress and quiz performance over time</p>
          </div>
          <Link to="/dashboard" className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span> New Quiz
          </Link>
        </div>

        {/* Average Progress Chart */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Average Progress</p>
              <p className="text-slate-900 text-3xl font-bold leading-tight">{avgScore}%
                {scores.length > 1 && <span className="text-emerald-500 text-base font-medium ml-2">across {scores.length} quizzes</span>}
              </p>
            </div>
          </div>
          <div className="flex min-h-[200px] w-full flex-col gap-4 py-4">
            <svg fill="none" height="180" preserveAspectRatio="none" viewBox="0 0 1000 200" width="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#135bec" stopOpacity="0.2" /><stop offset="100%" stopColor="#135bec" stopOpacity="0" /></linearGradient>
              </defs>
              <path d="M0 160 C 100 150, 150 60, 200 80 S 300 120, 400 90 S 500 30, 600 50 S 700 100, 800 70 S 900 20, 1000 30 V 200 H 0 Z" fill="url(#chartGradient)" />
              <path d="M0 160 C 100 150, 150 60, 200 80 S 300 120, 400 90 S 500 30, 600 50 S 700 100, 800 70 S 900 20, 1000 30" stroke="#135bec" strokeLinecap="round" strokeWidth="3" />
            </svg>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Search by topic..." type="text" />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
              <span className="material-symbols-outlined text-5xl">history_edu</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No score history yet</h3>
            <p className="text-slate-500 mb-8 max-w-sm">Take your first quiz to start tracking your progress and see your learning journey unfold!</p>
            <Link to="/dashboard" className="bg-primary text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
              Take Your First Quiz
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Topic</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Questions</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Correct</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Score</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filtered.map((s) => {
                      const colors = getScoreColor(s.score).split(' ');
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{s.topic}</td>
                          <td className="px-6 py-4 text-slate-600">{s.total_questions}</td>
                          <td className="px-6 py-4 text-center">{s.correct_answers}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${colors[1]} rounded-full`} style={{ width: `${s.score}%` }} />
                              </div>
                              <span className={`font-bold ${colors[0]}`}>{s.score}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(s.completed_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-8 flex justify-between items-center text-sm">
              <p className="text-slate-500">Showing {filtered.length} of {scores.length} entries</p>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="size-6 text-primary">
              <svg fill="currentColor" viewBox="0 0 48 48"><path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" /></svg>
            </div>
            <span className="text-slate-900 font-bold">Preparify</span>
          </div>
          <div className="text-slate-500 text-sm">© 2024 Preparify Inc. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
