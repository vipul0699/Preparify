import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quizApi, authApi, flashcardsApi } from '../services/api';

export default function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('AI Search');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [difficulty, setDifficulty] = useState('Easy');
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState([]);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [flashcardStats, setFlashcardStats] = useState({ due_count: 0, total_count: 0 });

  useEffect(() => {
    authApi.getScores().then((data) => setScores(data.slice(0, 3))).catch(() => {});
    // Refresh profile to get latest streak/limit
    authApi.getProfile().then(setUser).catch(() => {});
    flashcardsApi.getStats().then(setFlashcardStats).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const limitMB = user?.is_paid ? 20 : 5;
    if (selectedFile.size > limitMB * 1024 * 1024) {
      alert(`File size exceeds your ${limitMB}MB limit. ${!user?.is_paid ? 'Upgrade to Pro for 20MB limits!' : ''}`);
      e.target.value = null;
      return;
    }
    setFile(selectedFile);
    if (!topic) {
      const name = selectedFile.name.split('.')[0].replace(/[-_]/g, ' ');
      setTopic(name.charAt(0).toUpperCase() + name.slice(1));
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    if (source === 'My Materials' && !content.trim() && !file) return;
    
    setLoading(true);
    try {
      if (source === 'My Materials') {
        const formData = new FormData();
        formData.append('topic', topic);
        if (file) {
          formData.append('file', file);
        } else {
          formData.append('content', content);
        }
        await quizApi.ingest(topic, formData);
      }
      const data = await quizApi.generate(topic, difficulty);
      // Refresh profile after quiz (streak might update)
      authApi.getProfile().then(setUser).catch(() => {});
      navigate('/quiz', { state: { quizId: data.quiz_id, questions: data.questions, topic, difficulty } });
    } catch (err) {
      alert(err.data?.error || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return { text: 'Excellent', color: 'text-green-500', bg: 'bg-green-100 text-green-600', icon: 'check_circle' };
    if (score >= 70) return { text: 'Good', color: 'text-blue-500', bg: 'bg-blue-100 text-blue-600', icon: 'verified' };
    if (score >= 50) return { text: 'Developing', color: 'text-yellow-500', bg: 'bg-yellow-100 text-yellow-600', icon: 'pending' };
    return { text: 'Needs Work', color: 'text-red-500', bg: 'bg-red-100 text-red-600', icon: 'error' };
  };

  const sidebarLinks = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
    { id: 'flashcards', icon: 'style', label: 'Smart Flashcards', to: '/flashcards' },
    { id: 'scores', icon: 'trending_up', label: 'Score History', to: '/scores' },
  ];

  return (
    <div className="font-[Inter] text-slate-900 flex h-screen overflow-hidden bg-[#f6f6f8]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden lg:flex">
        <div className="p-6 flex items-center gap-3 text-primary">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white"><span className="material-symbols-outlined">school</span></div>
          <h1 className="text-xl font-bold tracking-tight">Preparify</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {sidebarLinks.map((l) => (
            <Link key={l.id} to={l.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeNav === l.id ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span className="material-symbols-outlined">{l.icon}</span>
              <span className="text-sm">{l.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 px-3 py-2 w-full text-slate-600 hover:text-red-500 transition-colors cursor-pointer">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">Hello, {user?.username || 'Learner'}!</h2>
            <p className="text-xs text-slate-500">Ready to boost your skills today?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {(user?.username || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Start a New Quiz</h3>
                  <p className="text-slate-500 mt-1 text-sm">Challenge yourself with an AI-generated assessment.</p>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Topic</label>
                      <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="e.g., Python Basics" type="text" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Quiz Source</label>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        {['AI Search', 'My Materials'].map((s) => (
                          <button key={s} onClick={() => setSource(s)} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${source === s ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {source === 'My Materials' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Study Materials</label>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Limit: {user?.is_paid ? '20MB' : '5MB'} {!user?.is_paid && ' (Free)'}
                        </div>
                      </div>

                      {!file ? (
                        <div className="grid grid-cols-1 gap-4">
                          <textarea 
                            value={content} 
                            onChange={(e) => setContent(e.target.value)} 
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm resize-none" 
                            placeholder="Paste your notes here..." 
                          />
                          <div className="relative group">
                            <input 
                              type="file" 
                              accept=".pdf,.docx,.txt" 
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-white group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">cloud_upload</span>
                              <p className="text-xs font-medium text-slate-500 group-hover:text-slate-700">Or upload PDF, DOCX, or TXT</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in zoom-in-95 duration-200">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">description</span>
                            <div>
                              <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                              <p className="text-[10px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button onClick={() => { setFile(null); setContent(''); }} className="text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-xl">close</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['Easy', 'Medium', 'Hard'].map((d) => (
                        <button key={d} onClick={() => setDifficulty(d)} className={`px-4 py-3 text-center rounded-lg border transition-all text-sm font-medium ${difficulty === d ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading ? (
                      <><span className="material-symbols-outlined animate-spin">progress_activity</span> Generating...</>
                    ) : (
                      <><span className="material-symbols-outlined">auto_awesome</span> Generate Quiz</>
                    )}
                  </button>
                </div>
              </section>

              {/* Exam Simulations Entry */}
              <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group border border-slate-700">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="max-w-md">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-primary px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-white">New Feature</span>
                      <span className="material-symbols-outlined text-amber-400">timer</span>
                    </div>
                    <h3 className="text-3xl font-black tracking-tight mb-2">Exam Simulations</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Attempt full-length CAT past papers and AI-certified mocks under strict official timing and scoring rules.
                    </p>
                  </div>
                  <Link to="/exams" className="bg-white text-slate-900 font-black py-4 px-10 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 shadow-lg shadow-white/5 whitespace-nowrap">
                    Enter Exam Hub <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-12 -right-12 size-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
                <span className="material-symbols-outlined absolute -bottom-10 -right-4 text-[180px] text-white/5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">history_edu</span>
              </section>

              {/* Recent Activity */}
              <section>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                  <Link to="/scores" className="text-primary text-sm font-semibold hover:underline">View All</Link>
                </div>
                <div className="grid gap-4">
                  {scores.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                      <span className="material-symbols-outlined text-4xl mb-2 block">quiz</span>
                      <p>No quizzes taken yet. Start your first quiz above!</p>
                    </div>
                  ) : scores.map((s) => {
                    const label = getScoreLabel(s.score);
                    return (
                      <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-primary/40 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`size-12 ${label.bg} rounded-lg flex items-center justify-center`}>
                            <span className="material-symbols-outlined">{label.icon}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{s.topic}</h4>
                            <p className="text-xs text-slate-500">{new Date(s.completed_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900">{s.score}/100</p>
                          <p className={`text-[10px] uppercase font-bold ${label.color} tracking-wider`}>{label.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Streak Widget */}
              <section className="bg-white/70 backdrop-blur-md p-6 rounded-xl border border-white/20 shadow-xl overflow-hidden relative">
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Study Streak</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">{user?.streak_count || 0}</span>
                      <span className="text-slate-500 font-bold">Days</span>
                    </div>
                  </div>
                  <div className={`size-16 rounded-2xl flex items-center justify-center animate-bounce duration-[2000ms] ${user?.streak_count > 0 ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-400'}`}>
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {user?.streak_count > 0 ? 'local_fire_department' : 'mode_night'}
                    </span>
                  </div>
                </div>
                {user?.streak_count === 0 && (
                  <p className="mt-4 text-xs text-slate-500 italic">"First quiz of the day starts your streak!"</p>
                )}
                <div className="absolute -bottom-8 -left-8 size-24 bg-orange-500/5 rounded-full blur-2xl" />
              </section>

              {/* Smart Flashcards Reminder */}
              {flashcardStats.due_count > 0 && (
                <section className="bg-primary p-6 rounded-xl text-white shadow-lg shadow-primary/30 relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg leading-tight mb-1">Ready for a review?</h3>
                    <p className="text-blue-100/80 text-sm mb-4">
                      {flashcardStats.sample_topic ? `Hey, you struggled with '${flashcardStats.sample_topic}' recently. ` : ''}
                      Ready for a 2-minute review?
                    </p>
                    <Link to="/flashcards" className="inline-block bg-white text-primary text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                      Start {flashcardStats.due_count} Cards
                    </Link>
                  </div>
                  <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-9xl text-white/10 group-hover:scale-110 transition-transform">style</span>
                </section>
              )}

              <section className="bg-white/70 backdrop-blur-md p-6 rounded-xl border border-white/20 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Daily Quiz Usage</h3>
                  <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
                    {user?.is_paid ? 'UNLIMITED' : 'DAILY LIMIT'}
                  </span>
                </div>
                
                {!user?.is_paid && (
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      {/* We'll estimate this based on recent scores for now, or fetch from backend count */}
                      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${Math.min((scores.filter(s => new Date(s.completed_at).toDateString() === new Date().toDateString()).length / 3) * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>{scores.filter(s => new Date(s.completed_at).toDateString() === new Date().toDateString()).length} / 3 Quizzes</span>
                      <span>FREE TIER</span>
                    </div>
                  </div>
                )}
                
                {user?.is_paid && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    <span className="text-xs font-bold">Pro Account: Unlimited Quizzes</span>
                  </div>
                )}
              </section>

              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <h3 className="text-lg font-bold text-slate-900 mb-6 relative z-10">Learning Progress</h3>
                <div className="relative h-32 w-full bg-slate-50 rounded-lg overflow-hidden flex flex-col justify-end p-4 z-10">
                  <div className="flex items-end gap-2 h-full px-1">
                    {[30, 45, 25, 60, 80, 50, 95].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/40 hover:bg-primary rounded-t-sm transition-all cursor-pointer group relative" style={{ height: `${h}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {h}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 space-y-4 relative z-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Score Avg.</span>
                    <span className="font-bold text-slate-900">
                      {scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) : 0}%
                    </span>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-to-br from-primary to-blue-700 p-6 rounded-xl text-white shadow-lg shadow-primary/30 relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg leading-tight mb-2">Upgrade to Pro</h3>
                  <p className="text-blue-100/80 text-sm mb-4">Unlock unlimited quizzes, personalized study paths, and detailed analytics.</p>
                  <button className="bg-white text-primary text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">Get Started</button>
                </div>
                <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-9xl text-white/10 group-hover:scale-110 transition-transform">rocket_launch</span>
              </section>

              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Study Tip</h3>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-primary">lightbulb</span>
                  <p className="text-sm text-slate-600 italic">"Spaced repetition is key! Re-take quizzes you scored under 70% on at least twice a week."</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
