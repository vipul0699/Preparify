import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const data = await authApi.googleLogin(credentialResponse.credential);
      login({ access: data.tokens.access, refresh: data.tokens.refresh }, data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const data = await authApi.login({ username: form.username, password: form.password });
        login({ access: data.access, refresh: data.refresh }, null);
        const profile = await authApi.getProfile();
        login({ access: data.access, refresh: data.refresh }, profile);
      } else {
        const data = await authApi.register(form);
        login(data.tokens, data.user);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.data;
      if (typeof msg === 'object') {
        setError(Object.values(msg).flat().join(' '));
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f6f6f8] font-[Inter] text-slate-900 min-h-screen flex flex-col">
      <header className="w-full px-6 lg:px-40 py-5 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
          <h2 className="text-slate-900 text-xl font-bold tracking-tight">Preparify</h2>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-transparent to-primary/10">
        <div className="w-full max-w-[480px]">
          <div className="bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-8 text-center">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-slate-600 text-base">
                {isLogin ? 'Log in to continue your learning journey.' : 'Join Preparify to ace your exams with personalized study plans.'}
              </p>
            </div>
            <div className="px-8 pb-8 flex flex-col gap-6">
              {/* Google Sign-In Button */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed.')}
                  text={isLogin ? 'signin_with' : 'signup_with'}
                  shape="rectangular"
                  size="large"
                  width="400"
                  theme="outline"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-500 font-medium">Or continue with email</span>
                </div>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                    <input name="username" value={form.username} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="johndoe123" type="text" required />
                  </div>
                </div>

                {!isLogin && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                      <input name="email" value={form.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="john@example.com" type="email" required />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                    <input name="password" value={form.password} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="••••••••" type="password" required />
                  </div>
                </div>

                {!isLogin && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Confirm Password</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                      <input name="password_confirm" value={form.password_confirm} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="••••••••" type="password" required />
                    </div>
                  </div>
                )}

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all mt-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer" type="submit">
                  {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Create Account')}
                </button>
              </form>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 text-center">
              <p className="text-slate-600 text-sm">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Link className="text-primary font-bold hover:underline" to={isLogin ? '/signup' : '/login'}>
                  {isLogin ? 'Sign up' : 'Log in'}
                </Link>
              </p>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">verified_user</span><span className="text-xs font-medium uppercase tracking-wider">Secure Encryption</span></div>
            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">shield</span><span className="text-xs font-medium uppercase tracking-wider">Privacy Guaranteed</span></div>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 text-center text-slate-500 text-xs">
        <p>© 2024 Preparify Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
