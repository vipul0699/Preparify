import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/AnimatedBackground';

export default function LandingPage() {
  const { user } = useAuth();
  const [personalizedTopics, setPersonalizedTopics] = useState([]);

  useEffect(() => {
    async function fetchPersonalizedTopics() {
      if (user) {
        try {
          const response = await fetch('/api/quiz/personalized-topics/');
          if (response.ok) {
            const data = await response.json();
            if (data.topics && data.topics.length > 0) {
              setPersonalizedTopics(data.topics);
            }
          }
        } catch (error) {
          console.error("Failed to fetch personalized topics:", error);
        }
      }
    }
    fetchPersonalizedTopics();
  }, [user]);

  return (
    <div className="font-[Inter] text-slate-900 min-h-screen flex flex-col relative">
      <AnimatedBackground customLabels={personalizedTopics} />
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-20 py-4 bg-white/40 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary">
          <div className="size-8">
            <svg fill="currentColor" viewBox="0 0 48 48"><path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" /></svg>
          </div>
          <h2 className="text-slate-900 text-xl font-bold tracking-[-0.015em]">Preparify</h2>
        </div>
        <div className="flex flex-1 justify-end items-center gap-4 md:gap-8">
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-slate-800 text-sm font-medium hover:text-primary transition-colors drop-shadow-sm" href="#features">Features</a>
            <a className="text-slate-800 text-sm font-medium hover:text-primary transition-colors drop-shadow-sm" href="#pricing">Pricing</a>
            {user ? (
              <Link to="/dashboard" className="text-slate-900 text-sm font-medium px-4 py-2 rounded-lg border border-slate-300 hover:bg-white/50 transition-colors backdrop-blur-sm">Dashboard</Link>
            ) : (
              <Link to="/login" className="text-slate-900 text-sm font-medium px-4 py-2 rounded-lg border border-slate-300 hover:bg-white/50 transition-colors backdrop-blur-sm">Login</Link>
            )}
          </nav>
          <Link to={user ? "/dashboard" : "/signup"} className="flex min-w-[100px] items-center justify-center rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex flex-col flex-1 px-6 md:px-20 relative z-10">
        {/* Hero */}
        <div className="flex flex-col gap-10 py-12 md:py-20 lg:flex-row items-center">
          <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto items-center text-center relative">
            <div className="absolute inset-0 bg-white/40 blur-[100px] -z-10 rounded-full" />
            <div className="flex flex-col gap-4">
              <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-[-0.033em] md:text-7xl drop-shadow-sm">
                Master Any Topic with AI-Generated Quizzes
              </h1>
              <p className="text-slate-700 text-lg md:text-2xl font-medium leading-relaxed drop-shadow-sm max-w-2xl mx-auto">
                Generate personalized quizzes on any subject in seconds. Get instant feedback and track your learning progress with our advanced AI engine.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={user ? "/dashboard" : "/signup"} className="flex min-w-[240px] items-center justify-center rounded-xl h-14 px-8 bg-primary text-white text-lg font-bold hover:scale-[1.05] shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all">
                Start Your First Quiz - Free
              </Link>
              <a href="#features" className="flex min-w-[160px] items-center justify-center rounded-xl h-14 px-8 bg-white/70 backdrop-blur-md text-slate-900 text-lg font-bold hover:bg-white border border-white/50 transition-all shadow-sm">
                How it works
              </a>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-primary/20" />
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-primary/30" />
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-primary/40" />
              </div>
              <p className="text-sm font-bold text-slate-700 drop-shadow-sm">Join <span className="text-primary font-black">10,000+</span> learners mastering topics daily</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="flex flex-col gap-12 py-20 relative">
          <div className="absolute inset-0 bg-white/10 blur-[150px] -z-10 rounded-full" />
          <div className="flex flex-col gap-4 text-center items-center">
            <h2 className="text-slate-900 text-3xl font-black md:text-5xl max-w-[800px] drop-shadow-sm">Powerful Features for Smarter Learning</h2>
            <p className="text-slate-700 font-medium text-lg max-w-[700px] drop-shadow-sm">Our AI-driven platform provides everything you need to master new subjects efficiently and effectively.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'smart_toy', title: 'AI Quiz Generation', desc: 'Simply enter a topic or paste text, and our AI will create a comprehensive quiz tailored to your needs.' },
              { icon: 'fact_check', title: 'Instant Scoring', desc: 'Get immediate results and detailed explanations for every answer to reinforce your understanding.' },
              { icon: 'trending_up', title: 'Progress Tracking', desc: 'Monitor your improvement over time with detailed analytics and personalized learning paths.' },
              { icon: 'upload_file', title: 'Material Ingestion', desc: 'Upload your PDFs, notes, or textbooks to create custom study sessions from your own materials.' },
            ].map((f) => (
              <div key={f.title} className="flex flex-col gap-4 rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl shadow-lg p-6 hover:border-primary/50 hover:-translate-y-2 hover:bg-white/80 transition-all duration-300">
                <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary/20 text-primary shadow-[inset_0_0_10px_rgba(255,255,255,0.5)]">
                  <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-slate-900 text-xl font-bold">{f.title}</h3>
                  <p className="text-slate-700 text-sm leading-relaxed font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div id="pricing" className="flex flex-col gap-4 text-center items-center py-10 relative">
          <h2 className="text-slate-900 text-3xl font-black md:text-5xl drop-shadow-sm">Simple Pricing for Everyone</h2>
          <p className="text-slate-700 font-medium text-lg max-w-[600px] drop-shadow-sm">Choose the plan that fits your learning journey.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 mb-20">
          {/* Free */}
          <div className="flex flex-col gap-6 rounded-3xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-lg p-8 hover:bg-white/90 transition-all duration-300">
            <div className="flex flex-col gap-2">
              <h3 className="text-slate-900 text-xl font-bold">Free</h3>
              <div className="flex items-baseline gap-1"><span className="text-slate-900 text-5xl font-black">$0</span><span className="text-slate-600 font-bold text-base">/mo</span></div>
              <p className="text-slate-600 font-medium text-sm">Explore the power of AI learning.</p>
            </div>
            <Link to="/signup" className="flex w-full items-center justify-center rounded-xl h-12 px-6 bg-slate-200/50 text-slate-900 border border-slate-300 text-sm font-bold hover:bg-white transition-colors shadow-sm">Get Started</Link>
            <ul className="flex flex-col gap-4 pt-4 border-t border-slate-300/50">
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">bolt</span> Core Intelligence Engine</li>
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">check_circle</span> 5 Quizzes / month</li>
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">check_circle</span> Basic Feedback Logic</li>
            </ul>
          </div>
          {/* Pro */}
          <div className="flex flex-col gap-6 rounded-3xl border-2 border-primary bg-white/90 backdrop-blur-2xl p-8 shadow-[0_20px_50px_rgba(59,130,246,0.2)] relative lg:scale-105 hover:scale-110 transition-transform duration-300 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md text-white text-xs font-bold px-5 py-1.5 rounded-full uppercase tracking-wider">Most Popular</div>
            <div className="flex flex-col gap-2">
              <h3 className="text-slate-900 text-xl font-bold">Pro</h3>
              <div className="flex items-baseline gap-1"><span className="text-slate-900 text-5xl font-black">$12</span><span className="text-slate-600 font-bold text-base">/mo</span></div>
              <p className="text-slate-600 font-medium text-sm">For serious learners and students.</p>
            </div>
            <button className="flex w-full items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-[0_5px_15px_rgba(59,130,246,0.3)] hover:scale-[1.03] hover:shadow-[0_8px_25px_rgba(59,130,246,0.5)] transition-all">Go Pro</button>
            <ul className="flex flex-col gap-4 pt-4 border-t border-slate-200">
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">psychology</span> Advanced Reasoning Engine</li>
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">check_circle</span> Unlimited Quizzes</li>
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">check_circle</span> Deep Conceptual Analysis</li>
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">check_circle</span> 50-Page PDF Processing</li>
            </ul>
          </div>
          {/* Institution */}
          <div className="flex flex-col gap-6 rounded-3xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-lg p-8 hover:bg-white/90 transition-all duration-300">
            <div className="flex flex-col gap-2">
              <h3 className="text-slate-900 text-xl font-bold">Institution</h3>
              <div className="flex items-baseline gap-1"><span className="text-slate-900 text-5xl font-black">$49</span><span className="text-slate-600 font-bold text-base">/mo</span></div>
              <p className="text-slate-600 font-medium text-sm">For schools and organizations.</p>
            </div>
            <button className="flex w-full items-center justify-center rounded-xl h-12 px-6 bg-slate-200/50 text-slate-900 border border-slate-300 text-sm font-bold hover:bg-white transition-colors shadow-sm">Contact Sales</button>
            <ul className="flex flex-col gap-4 pt-4 border-t border-slate-300/50">
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">rocket_launch</span> Expert Multimodal Engine</li>
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">check_circle</span> Full Textbook Ingestion</li>
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">check_circle</span> Deep Conceptual Analysis</li>
              <li className="flex items-center gap-3 text-sm text-slate-700 font-medium"><span className="material-symbols-outlined text-primary text-xl drop-shadow-sm">check_circle</span> Team Admin Dashboard</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-xl border-t border-white/30 py-12 px-6 md:px-20 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-primary">
            <div className="size-6">
              <svg fill="currentColor" viewBox="0 0 48 48"><path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" /></svg>
            </div>
            <h2 className="text-slate-900 text-lg font-bold drop-shadow-sm">Preparify</h2>
          </div>
          <div className="flex gap-8 text-sm text-slate-700 font-medium"><a className="hover:text-primary drop-shadow-sm" href="#">Privacy Policy</a><a className="hover:text-primary drop-shadow-sm" href="#">Terms of Service</a><a className="hover:text-primary drop-shadow-sm" href="#">Contact</a></div>
          <p className="text-sm font-medium text-slate-600 drop-shadow-sm">© 2026 Preparify AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
