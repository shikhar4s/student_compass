import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps { onSwitchToSignup: () => void; }

export const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter both your email and password.');
      return;
    }
    setLoading(true);
    const result = await signIn(email.trim(), password);
    if (result.error) setError(result.error.message);
    setLoading(false);
  };

  return (
    <AuthLayout eyebrow="Welcome back" title="Pick up where you left off." description="Sign in to check your habits, reflect on your day, and keep moving forward.">
      {error ? (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{error}</p>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-bold text-slate-700">Email address</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" placeholder="you@example.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
          </div>
        </div>
        <div>
          <label htmlFor="login-password" className="mb-2 block text-sm font-bold text-slate-700">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}{loading ? 'Signing in…' : 'Sign in'}{!loading ? <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /> : null}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">New to Student Compass?{' '}<button type="button" onClick={onSwitchToSignup} className="font-extrabold text-indigo-600 hover:text-indigo-800">Create an account</button></p>
    </AuthLayout>
  );
};
