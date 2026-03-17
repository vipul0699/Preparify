import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { examsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ExamDashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const data = await examsApi.list();
      setExams(data);
    } catch (err) {
      console.error("Failed to fetch exams:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (examId) => {
    try {
      const data = await examsApi.start(examId);
      navigate(`/exam-simulator/${data.attempt_id}`, { state: { examId, attemptId: data.attempt_id, examData: data } });
    } catch (err) {
      alert(err.data?.error || "Failed to start exam");
    }
  };

  const handleGenerateMock = async () => {
    setGenerating(true);
    try {
      await examsApi.generateMock('CAT');
      fetchExams();
    } catch (err) {
      alert(err.data?.error || "Failed to generate mock");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-[#f6f6f8] font-[Inter] text-slate-900 min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-40 py-3 sticky top-0 z-50">
        <Link to="/dashboard" className="flex items-center gap-4">
          <div className="size-8 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48"><path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" /></svg>
          </div>
          <h2 className="text-slate-900 text-lg font-bold">Preparify Exams</h2>
        </Link>
        <Link to="/dashboard" className="text-slate-600 text-sm font-medium hover:text-primary transition-colors">Back to Dashboard</Link>
      </header>

      <main className="flex-1 px-6 lg:px-40 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Exam Simulation Hub</h1>
              <p className="text-slate-500 text-lg">Official past papers and AI-certified mock exams.</p>
            </div>
            {user?.is_paid && (
              <button 
                onClick={handleGenerateMock}
                disabled={generating}
                className="bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
              >
                {generating ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined">auto_awesome</span>}
                Generate Certified CAT Mock
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group">
                  <div className="flex justify-between items-start">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${exam.is_pro ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {exam.is_pro ? 'Certified Mock' : 'Past Paper'}
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">history_edu</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{exam.name}</h3>
                    <div className="flex items-center gap-4 text-slate-500 text-sm">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {exam.duration}m</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">category</span> {exam.exam_type}</span>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 flex gap-2">
                    <button 
                      onClick={() => handleStart(exam.id)}
                      className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      Attempt Now <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!user?.is_paid && (
            <div className="mt-12 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Upgrade to Pro</span>
                  <span className="material-symbols-outlined text-amber-400">workspace_premium</span>
                </div>
                <h2 className="text-3xl font-black mb-3">Master CAT with AI Simulations</h2>
                <p className="text-slate-300">Unlock Certified Mock Exams generated by Gemini 1.5 Pro, featuring predicted percentiles and strategy analysis.</p>
              </div>
              <button className="bg-white text-slate-900 font-black py-4 px-10 rounded-2xl hover:bg-slate-100 transition-all whitespace-nowrap">Get Pro Access</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
