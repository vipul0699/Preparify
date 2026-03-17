import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { examsApi } from '../services/api';

export default function ExamSimulator() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { examData } = location.state || {};

  const [sections, setSections] = useState([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (examData) {
      initExam(examData);
    } else {
      // Re-fetch if state lost
      // For now, assume state is present
      setLoading(false);
    }
  }, [examData]);

  const initExam = (data) => {
    setSections(data.sections || []);
    setTimeLeft((data.sections?.[0]?.duration || 40) * 60);
    setLoading(false);
  };

  const handleNextSection = useCallback(() => {
    if (currentSectionIdx < sections.length - 1) {
      setCurrentSectionIdx(prev => prev + 1);
      setCurrentQuestionIdx(0);
      setTimeLeft(sections[currentSectionIdx + 1].duration * 60);
    } else {
      finishExam();
    }
  }, [currentSectionIdx, sections]);

  useEffect(() => {
    if (timeLeft <= 0 && !loading) {
      handleNextSection();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, handleNextSection]);

  const finishExam = async () => {
    const formattedResponses = Object.entries(answers).map(([qId, ans]) => ({
      question_id: qId,
      answer: ans,
      time_taken: 0 // Track per question later
    }));

    try {
      const res = await examsApi.submit(attemptId, { responses: formattedResponses });
      navigate('/exam-report', { state: { result: res, attemptId } });
    } catch (err) {
      alert("Failed to submit exam. Please contact support.");
    }
  };

  if (loading) return <div>Loading Simulator...</div>;

  const currentSection = sections[currentSectionIdx];
  const questions = currentSection?.questions || []; // Simplified: treating groups as flat list for now
  const currentQuestion = questions[currentQuestionIdx];

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white min-h-screen flex flex-col font-[Inter]">
      {/* Exam Header */}
      <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-6">
          <h2 className="font-black text-lg tracking-tight">PREPARIFY SIMULATOR</h2>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Section</span>
            <span className="text-sm font-bold bg-primary px-3 py-1 rounded">{currentSection?.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Remaining</span>
            <span className={`text-2xl font-black tabular-nums ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button onClick={() => { if(window.confirm("Submit section?")) handleNextSection() }} className="bg-white text-slate-900 px-6 py-2 rounded-lg font-black text-sm hover:bg-slate-100 transition-all">
            SUBMIT SECTION
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-12">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 flex items-center gap-3">
              <span className="size-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500">
                {currentQuestionIdx + 1}
              </span>
              <div className="h-[2px] flex-1 bg-slate-100" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 leading-relaxed mb-10">
              {currentQuestion?.text}
            </h1>

            {currentQuestion?.type === 'MCQ' ? (
              <div className="grid gap-4">
                {currentQuestion.options?.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setAnswers({...answers, [currentQuestion.id]: opt})}
                    className={`p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${answers[currentQuestion.id] === opt ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <span className={`size-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${answers[currentQuestion.id] === opt ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium text-slate-700">{opt}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type your answer (TITA)</p>
                <input 
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => setAnswers({...answers, [currentQuestion.id]: e.target.value})}
                  className="w-full p-5 rounded-xl border-2 border-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-xl font-bold"
                  placeholder="Enter value..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <aside className="w-80 border-l border-slate-200 bg-slate-50 flex flex-col p-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">apps</span> Question Palette
          </h3>
          
          <div className="grid grid-cols-5 gap-3">
            {questions.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`size-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentQuestionIdx === idx ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : answers[questions[idx].id] ? 'bg-green-500 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="mt-auto space-y-4">
             <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
               <div className="flex items-center gap-2 text-slate-500">
                 <span className="size-3 rounded bg-green-500" /> Answered
               </div>
               <div className="flex items-center gap-2 text-slate-500">
                 <span className="size-3 rounded bg-white border border-slate-200" /> Unanswered
               </div>
             </div>
             
             <div className="flex gap-2">
               <button 
                 disabled={currentQuestionIdx === 0}
                 onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                 className="flex-1 bg-white border border-slate-200 py-3 rounded-lg font-bold text-xs disabled:opacity-30"
               >
                 PREV
               </button>
               <button 
                 disabled={currentQuestionIdx === questions.length - 1}
                 onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                 className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold text-xs disabled:opacity-30"
               >
                 NEXT
               </button>
             </div>
          </div>
        </aside>
      </main>

      {/* Footer Info */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 px-8 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>CAT Simulation Mode</span>
        <span>© 2024 Preparify Learning Systems</span>
        <span>System Secure • No Outside Navigation Allowed</span>
      </footer>
    </div>
  );
}
