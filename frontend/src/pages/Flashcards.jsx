import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { flashcardsApi } from '../services/api';

export default function Flashcards() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ due_count: 0, total_count: 0 });

  useEffect(() => {
    loadCards();
    flashcardsApi.getStats().then(setStats).catch(() => {});
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await flashcardsApi.list(true); // dueOnly = true
      setCards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (quality) => {
    const card = cards[currentIndex];
    try {
      await flashcardsApi.review(card.id, quality);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        // Finished
        setCards([]);
        flashcardsApi.getStats().then(setStats).catch(() => {});
      }
    } catch (err) {
      alert('Failed to update flashcard.');
    }
  };

  const currentCard = cards[currentIndex];

  const sidebarLinks = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
    { id: 'flashcards', icon: 'style', label: 'Smart Flashcards', to: '/flashcards' },
    { id: 'scores', icon: 'trending_up', label: 'Score History', to: '/scores' },
  ];

  return (
    <div className="font-[Inter] text-slate-900 flex h-screen overflow-hidden bg-[#f6f6f8]">
      {/* Sidebar (simplified copy from Dashboard) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden lg:flex">
        <div className="p-6 flex items-center gap-3 text-primary">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white"><span className="material-symbols-outlined">school</span></div>
          <h1 className="text-xl font-bold tracking-tight">Preparify</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {sidebarLinks.map((l) => (
            <Link key={l.id} to={l.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${l.id === 'flashcards' ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
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

      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto p-4 md:p-10">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Smart Flashcards</h2>
              <p className="text-slate-500 text-sm font-medium">Spaced Repetition Review</p>
            </div>
            <div className="flex gap-2">
               <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Due</p>
                  <p className="font-black text-primary">{stats.due_count}</p>
               </div>
               <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                  <p className="font-black text-slate-900">{stats.total_count}</p>
               </div>
            </div>
          </header>

          {loading ? (
             <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-500 font-medium">Loading your cards...</p>
             </div>
          ) : cards.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
               <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl">done_all</span>
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">You're all caught up!</h3>
               <p className="text-slate-500 mb-8">No flashcards due for review right now. Take more quizzes to generate new ones!</p>
               <Link to="/dashboard" className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                  Go to Dashboard
               </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}></div>
                </div>
              </div>

              <div 
                className={`min-h-[300px] bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 transform ${showAnswer ? 'rotate-y-180' : ''}`}
                onClick={() => !showAnswer && setShowAnswer(true)}
              >
                {!showAnswer ? (
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Question</p>
                    <h3 className="text-2xl font-bold text-slate-900 leading-snug">{currentCard.question_text}</h3>
                    <p className="text-slate-400 text-sm italic mt-8">Click to reveal answer</p>
                  </div>
                ) : (
                  <div className="space-y-6 w-full">
                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Correct Answer</p>
                    <h3 className="text-2xl font-bold text-slate-900 leading-snug">{currentCard.answer_text}</h3>
                    {currentCard.explanation && (
                      <div className="bg-slate-50 p-4 rounded-xl text-left mt-4 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Explanation</p>
                        <p className="text-sm text-slate-600">{currentCard.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showAnswer && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <p className="text-center text-sm font-bold text-slate-500 uppercase tracking-wider">How well did you know this?</p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                      { q: 0, label: 'Forgot', color: 'bg-red-500' },
                      { q: 1, label: 'Hard', color: 'bg-orange-500' },
                      { q: 2, label: 'Poor', color: 'bg-yellow-500' },
                      { q: 3, label: 'OK', color: 'bg-blue-400' },
                      { q: 4, label: 'Good', color: 'bg-blue-600' },
                      { q: 5, label: 'Easy', color: 'bg-green-500' },
                    ].map((btn) => (
                      <button
                        key={btn.q}
                        onClick={() => handleReview(btn.q)}
                        className={`${btn.color} text-white py-3 rounded-xl font-bold text-xs hover:opacity-90 transition-opacity shadow-lg active:scale-95`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
