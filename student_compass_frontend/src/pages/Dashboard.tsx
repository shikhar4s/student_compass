import React, { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, Brain, CalendarCheck2, CheckCircle2, HeartHandshake, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import type { AppPage } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface DashboardProps { onNavigate: (page: AppPage) => void; }
interface DashboardStats { moods: number; habits: number; journal: number; completedToday: number; }

const features = [
  { id: 'mood' as const, title: 'Mood check-in', description: 'Name what you feel and start a supportive conversation with Aura.', icon: Brain, action: 'Check in now', gradient: 'from-fuchsia-500 to-violet-600', surface: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
  { id: 'habits' as const, title: 'Habit tracker', description: 'Keep today’s promises visible and build momentum one day at a time.', icon: CalendarCheck2, action: 'View habits', gradient: 'from-emerald-500 to-teal-600', surface: 'bg-emerald-50', border: 'border-emerald-100' },
  { id: 'journal' as const, title: 'Private journal', description: 'Slow down, capture your thoughts, and notice what is changing.', icon: BookOpen, action: 'Start writing', gradient: 'from-amber-500 to-orange-600', surface: 'bg-amber-50', border: 'border-amber-100' },
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ moods: 0, habits: 0, journal: 0, completedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [moods, habits, journal] = await Promise.all([api.getMoods(), api.getHabits(), api.getJournalEntries()]);
      const today = new Date().toISOString().split('T')[0];
      setStats({
        moods: moods.length,
        habits: habits.length,
        journal: journal.length,
        completedToday: habits.filter((habit: { completions: { completed_date: string }[] }) => habit.completions.some((completion) => completion.completed_date === today)).length,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not load your latest activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadDashboard(); }, []);

  const firstName = user?.full_name?.trim().split(' ')[0] || 'there';
  const dateLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#171a3b] px-6 py-8 text-white shadow-xl shadow-indigo-200/40 sm:px-10 sm:py-10">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-bold text-cyan-300">{dateLabel}</p>
            <h1 className="mt-3 text-balance text-3xl font-black tracking-tight sm:text-5xl">Good to see you, {firstName}.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-indigo-100/75 sm:text-lg">You do not need a perfect day—just one useful next step. What would help most right now?</p>
            <button type="button" onClick={() => onNavigate('mood')} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-900 transition hover:-translate-y-0.5 hover:shadow-lg">
              <Sparkles className="h-4 w-4 text-violet-600" aria-hidden="true" />Start a mood check-in
            </button>
          </div>
          <div className="hidden h-32 w-32 items-center justify-center rounded-[2rem] border border-white/15 bg-white/10 backdrop-blur-sm lg:flex">
            <HeartHandshake className="h-14 w-14 text-cyan-300 animate-float" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section aria-labelledby="today-heading">
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">Your progress</p><h2 id="today-heading" className="mt-1 text-2xl font-black tracking-tight text-slate-950">Today at a glance</h2></div>
          {error ? <button type="button" onClick={() => void loadDashboard()} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"><RefreshCw className="h-4 w-4" />Retry</button> : null}
        </div>
        {error ? <div role="alert" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error} You can still use every feature below.</div> : null}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Mood check-ins', value: stats.moods, icon: Brain, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
            { label: 'Active habits', value: stats.habits, icon: CalendarCheck2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Done today', value: stats.completedToday, icon: CheckCircle2, color: 'text-cyan-600', bg: 'bg-cyan-50' },
            { label: 'Journal entries', value: stats.journal, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}><Icon className={`h-5 w-5 ${item.color}`} aria-hidden="true" /></div>
                <p className="mt-4 text-2xl font-black text-slate-950">{loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-300" /> : item.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="tools-heading">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">Daily tools</p>
        <h2 id="tools-heading" className="mt-1 text-2xl font-black tracking-tight text-slate-950">Choose your next step</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button key={feature.id} type="button" onClick={() => onNavigate(feature.id)} className={`group rounded-3xl border ${feature.border} ${feature.surface} p-6 text-left transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}><Icon className="h-6 w-6 text-white" aria-hidden="true" /></div>
                <h3 className="mt-6 text-xl font-black text-slate-950">{feature.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{feature.description}</p>
                <span className="mt-5 flex items-center gap-1 text-sm font-extrabold text-slate-900">{feature.action}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
