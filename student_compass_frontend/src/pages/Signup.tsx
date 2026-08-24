import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

interface SignupProps { onSwitchToLogin: () => void; }

export const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess(false);
    if (!email.trim() || !password || !fullName.trim()) {
      setError('Complete all three fields to create your account.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    setLoading(true);
    const result = await signUp(email.trim(), password, fullName.trim());
    if (result.error) setError(result.error.message);
    else { setSuccess(true); setPassword(''); }
    setLoading(false);
  };

  return (
    <AuthLayout eyebrow="Create your account" title="Start with one small check-in." description="Build a personal routine for your wellbeing, focus, and reflection.">
      {error ? <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{error}</p></div> : null}
      {success ? <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><div><p className="font-bold">Your account is ready.</p><button type="button" onClick={onSwitchToLogin} className="mt-1 font-bold underline underline-offset-2">Continue to sign in</button></div></div> : null}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div><label htmlFor="signup-name" className="mb-2 block text-sm font-bold text-slate-700">Full name</label><div className="relative"><User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input id="signup-name" type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Your name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" /></div></div>
        <div><label htmlFor="signup-email" className="mb-2 block text-sm font-bold text-slate-700">Email address</label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" placeholder="you@example.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" /></div></div>
        <div><label htmlFor="signup-password" className="mb-2 block text-sm font-bold text-slate-700">Password</label><div className="relative"><Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input id="signup-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
        <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}{loading ? 'Creating account…' : 'Create account'}{!loading ? <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /> : null}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account?{' '}<button type="button" onClick={onSwitchToLogin} className="font-extrabold text-indigo-600 hover:text-indigo-800">Sign in</button></p>
    </AuthLayout>
  );
};
