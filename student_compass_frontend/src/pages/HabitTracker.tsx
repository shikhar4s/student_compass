import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BarChart3, CalendarDays, Check, Flame, Loader2, Plus, RefreshCw, Target, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface Habit { id: string; title: string; description: string | null; color: string; target_days: number; completions: { completed_date: string }[]; }

const toLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStreakGrid = (completions: Habit['completions']) => {
  const completionSet = new Set(completions.map((completion) => completion.completed_date));
  return Array.from({ length: 28 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - index));
    const dateValue = toLocalDate(date);
    return { date: dateValue, completed: completionSet.has(dateValue) };
  });
};

const getCurrentStreak = (completions: Habit['completions']) => {
  const completionSet = new Set(completions.map((completion) => completion.completed_date));
  let streak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    if (!completionSet.has(toLocalDate(date))) break;
    streak += 1;
  }
  return streak;
};

export const HabitTracker: React.FC = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try { setHabits(await api.getHabits()); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Your habits could not be loaded.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void loadHabits(); }, [loadHabits]);

  const toggleHabitCompletion = async (habitId: string) => {
    const today = toLocalDate(new Date());
    const originalHabits = habits;
    const isCompleted = habits.find((habit) => habit.id === habitId)?.completions.some((completion) => completion.completed_date === today);
    setUpdatingId(habitId);
    setHabits((current) => current.map((habit) => habit.id === habitId ? { ...habit, completions: isCompleted ? habit.completions.filter((completion) => completion.completed_date !== today) : [...habit.completions, { completed_date: today }] } : habit));
    try {
      const response = await api.toggleHabitCompletion(habitId, today);
      if (response?.data) setHabits((current) => current.map((habit) => habit.id === habitId ? response.data : habit));
    } catch (requestError) {
      setHabits(originalHabits);
      setError(requestError instanceof Error ? requestError.message : 'That habit could not be updated.');
    } finally { setUpdatingId(null); }
  };

  const deleteHabit = async (habit: Habit) => {
    if (!window.confirm(`Delete “${habit.title}”? This cannot be undone.`)) return;
    setUpdatingId(habit.id);
    try { await api.deleteHabit(habit.id); setHabits((current) => current.filter((item) => item.id !== habit.id)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'That habit could not be deleted.'); }
    finally { setUpdatingId(null); }
  };

  const completedToday = habits.filter((habit) => habit.completions.some((completion) => completion.completed_date === toLocalDate(new Date()))).length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">Consistency, made visible</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Habit tracker</h1><p className="mt-3 text-slate-600">Focus on showing up today. The streak follows.</p></div>
        <button type="button" onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"><Plus className="h-5 w-5" />Add habit</button>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:max-w-xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Target className="h-4 w-4 text-indigo-600" />Active habits</div><p className="mt-2 text-3xl font-black">{loading ? '—' : habits.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Check className="h-4 w-4 text-emerald-600" />Done today</div><p className="mt-2 text-3xl font-black">{loading ? '—' : `${completedToday}/${habits.length}`}</p></div>
      </div>

      {error ? <div role="alert" className="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><span className="flex gap-2"><AlertCircle className="h-5 w-5 shrink-0" />{error}</span><button type="button" onClick={() => void loadHabits()} className="flex shrink-0 items-center gap-1 font-extrabold"><RefreshCw className="h-4 w-4" />Retry</button></div> : null}

      {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-label="Loading habits" /></div> : habits.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50"><CalendarDays className="h-8 w-8 text-indigo-500" /></span><h2 className="mt-5 text-xl font-black">Create your first habit</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Choose something small enough to repeat—even on a busy day.</p><button type="button" onClick={() => setShowAddModal(true)} className="mt-5 font-extrabold text-indigo-600">Add a habit →</button></div>
      ) : (
        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {habits.map((habit) => {
            const today = toLocalDate(new Date());
            const completed = habit.completions.some((completion) => completion.completed_date === today);
            const streak = getCurrentStreak(habit.completions);
            return (
              <article key={habit.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: habit.color }} />
                  <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-black text-slate-950">{habit.title}</h2><p className="mt-1 min-h-5 text-sm text-slate-500">{habit.description || 'A small promise to yourself.'}</p></div>
                  <button type="button" onClick={() => void deleteHabit(habit)} disabled={updatingId === habit.id} className="rounded-xl p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50" aria-label={`Delete ${habit.title}`}><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-4 text-sm"><span className="flex items-center gap-1.5 font-bold text-slate-600"><Flame className="h-4 w-4 text-orange-500" />{streak} day streak</span><span className="hidden items-center gap-1.5 text-slate-500 sm:flex"><BarChart3 className="h-4 w-4" />Goal {habit.target_days} days</span></div>
                  <button type="button" onClick={() => void toggleHabitCompletion(habit.id)} disabled={updatingId === habit.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold transition ${completed ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-300'}`} aria-pressed={completed}>{updatingId === habit.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{completed ? 'Done' : 'Mark done'}</button>
                </div>
                <div className="mt-5 grid grid-cols-7 gap-1.5" aria-label={`28 day completion history for ${habit.title}`}>
                  {getStreakGrid(habit.completions).map((day) => <span key={day.date} title={day.date} className={`aspect-square rounded-sm ${day.completed ? '' : 'bg-slate-100'}`} style={{ backgroundColor: day.completed ? habit.color : undefined }} />)}
                </div>
                <p className="mt-2 text-xs text-slate-400">Last 28 days</p>
              </article>
            );
          })}
        </div>
      )}
      {showAddModal ? <AddHabitModal onClose={() => setShowAddModal(false)} onAdd={(habit) => setHabits((current) => [...current, habit])} /> : null}
    </div>
  );
};

interface AddHabitModalProps { onClose: () => void; onAdd: (habit: Habit) => void; }
const AddHabitModal: React.FC<AddHabitModalProps> = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [color, setColor] = useState('#4F46E5'); const [targetDays, setTargetDays] = useState(7); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const colors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];
  const handleSubmit = async (event: React.FormEvent) => { event.preventDefault(); if (!title.trim()) return; setLoading(true); setError(''); try { const habit = await api.createHabit(title.trim(), description.trim(), color, targetDays); onAdd(habit); onClose(); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'The habit could not be created.'); } finally { setLoading(false); } };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="add-habit-title" className="w-full max-w-md rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-7">
        <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600">New routine</p><h2 id="add-habit-title" className="mt-1 text-2xl font-black">Add a habit</h2></div><button type="button" onClick={onClose} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:text-slate-900" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div><label htmlFor="habit-title" className="mb-2 block text-sm font-bold text-slate-700">Habit name</label><input id="habit-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="e.g. Study for 30 minutes" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></div>
          <div><label htmlFor="habit-description" className="mb-2 block text-sm font-bold text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span></label><textarea id="habit-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={180} placeholder="Keep the goal specific and realistic" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></div>
          <div><label htmlFor="target-days" className="mb-2 block text-sm font-bold text-slate-700">Weekly target</label><select id="target-days" value={targetDays} onChange={(event) => setTargetDays(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500">{[1,2,3,4,5,6,7].map((days) => <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'} per week</option>)}</select></div>
          <fieldset><legend className="mb-3 text-sm font-bold text-slate-700">Color</legend><div className="flex flex-wrap gap-3">{colors.map((value) => <button key={value} type="button" onClick={() => setColor(value)} className={`h-9 w-9 rounded-full transition ${color === value ? 'ring-2 ring-indigo-600 ring-offset-2' : 'hover:scale-110'}`} style={{ backgroundColor: value }} aria-label={`Select ${value}`} aria-pressed={color === value} />)}</div></fieldset>
          {error ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          <div className="grid grid-cols-2 gap-3 pt-1"><button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-4 py-3 font-extrabold text-slate-700">Cancel</button><button type="submit" disabled={loading || !title.trim()} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-extrabold text-white disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{loading ? 'Adding…' : 'Add habit'}</button></div>
        </form>
      </div>
    </div>
  );
};
