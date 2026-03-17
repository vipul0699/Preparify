import { useLocation, Link } from 'react-router-dom';

export default function ExamReport() {
  const location = useLocation();
  const { result } = location.state || {};

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f8]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No report data found</h2>
          <Link to="/exams" className="text-primary font-bold">Back to Exam Hub</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f6f6f8] font-[Inter] text-slate-900 min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-40 py-3 sticky top-0 z-50">
        <Link to="/dashboard" className="flex items-center gap-4">
          <div className="size-8 text-primary">
            <svg fill="currentColor" viewBox="0 0 48 48"><path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" /></svg>
          </div>
          <h2 className="text-slate-900 text-lg font-bold">Exam Report</h2>
        </Link>
        <Link to="/exams" className="text-slate-600 text-sm font-medium hover:text-primary transition-colors">Back to Exam Hub</Link>
      </header>

      <main className="flex-1 px-6 lg:px-40 py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-10">
            <div className="size-48 rounded-full border-[12px] border-primary/10 flex flex-col items-center justify-center relative">
               <span className="text-5xl font-black text-slate-900">{result.score}</span>
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Score</span>
               <div className="absolute inset-0 rounded-full border-[12px] border-primary border-t-transparent -rotate-45" />
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">Attempt Summary</h1>
               <p className="text-slate-500 text-lg">Great effort! Here is your performance breakdown for the CAT simulation.</p>
               
               {result.percentile !== undefined && (
                 <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl">
                    <span className="material-symbols-outlined text-amber-500">query_stats</span>
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Predicted Percentile</p>
                      <p className="text-2xl font-black text-slate-900 leading-none">{result.percentile.toFixed(2)} %ile</p>
                    </div>
                 </div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span> Sectional Breakdown
                </h3>
                <div className="space-y-4">
                   <p className="text-sm text-slate-500">Detailed sectional breakdown is coming soon. Currently showing overall performance.</p>
                   {/* We can add more details here as we refine the backend response */}
                </div>
             </div>

             <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
                <h3 className="text-lg font-bold mb-4 relative z-10">AI Strategy Insights</h3>
                <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                  Based on your score of {result.score}, our AI suggests focusing on QA speed and DILR set selection. Pro users get a full "Gap Analysis" for exam attempts.
                </p>
                <span className="material-symbols-outlined absolute -bottom-8 -right-8 text-[120px] text-white/5">psychology</span>
             </div>
          </div>

          <div className="flex justify-center pt-6">
             <Link to="/exams" className="bg-primary text-white font-bold py-4 px-12 rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
               Attempt Another Exam
             </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
