import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, MessageCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface MoodTrackerProps { onStartChat: (moodId: string, moodType: string) => void; }

const moods = [
  { type: 'Happy', emoji: '😊', label: 'Happy', description: 'Bright and positive', style: 'border-amber-200 bg-amber-50' },
  { type: 'Sad', emoji: '😢', label: 'Sad', description: 'Low or heavy', style: 'border-blue-200 bg-blue-50' },
  { type: 'Angry', emoji: '😠', label: 'Angry', description: 'Upset or tense', style: 'border-rose-200 bg-rose-50' },
  { type: 'Depressed', emoji: '😔', label: 'Very low', description: 'Drained or hopeless', style: 'border-slate-300 bg-slate-100' },
  { type: 'Frustrated', emoji: '😤', label: 'Frustrated', description: 'Stuck or overwhelmed', style: 'border-orange-200 bg-orange-50' },
  { type: 'Disappointed', emoji: '😞', label: 'Disappointed', description: 'Let down or discouraged', style: 'border-violet-200 bg-violet-50' },
];

export const MoodTracker: React.FC<MoodTrackerProps> = ({ onStartChat }) => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState('');
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!user || !selectedMood) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.createMood(selectedMood, intensity, note.trim() || undefined);
      onStartChat(data.id, selectedMood);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Your check-in could not be saved. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="max-w-2xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">Mood check-in</p>
        <h1 className="mt-2 text-balance text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">How are you feeling right now?</h1>
        <p className="mt-3 leading-7 text-slate-600">There is no wrong answer. Choose the feeling that comes closest, then add as much or as little context as you want.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="choose-mood">
          <h2 id="choose-mood" className="text-lg font-black text-slate-900">1. Choose a feeling</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {moods.map((mood) => {
              const selected = selectedMood === mood.type;
              return (
                <button key={mood.type} type="button" onClick={() => setSelectedMood(mood.type)} aria-pressed={selected} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 ${mood.style} ${selected ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}`}>
                  <span className="text-3xl" aria-hidden="true">{mood.emoji}</span>
                  <span className="mt-3 block font-extrabold text-slate-900">{mood.label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{mood.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="add-context">
          <h2 id="add-context" className="text-lg font-black text-slate-900">2. Add context</h2>
          <label htmlFor="mood-intensity" className="mt-5 flex items-center justify-between text-sm font-bold text-slate-700"><span>Intensity</span><span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-indigo-700">{intensity} / 5</span></label>
          <input id="mood-intensity" type="range" min="1" max="5" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} className="mt-4 h-2 w-full cursor-pointer accent-indigo-600" />
          <div className="mt-1 flex justify-between text-xs text-slate-400"><span>Mild</span><span>Strong</span></div>

          <label htmlFor="mood-note" className="mt-6 block text-sm font-bold text-slate-700">What is on your mind? <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea id="mood-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={600} rows={5} placeholder="A few words can help Aura understand the moment…" className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
          <p className="mt-1 text-right text-xs text-slate-400">{note.length}/600</p>

          {error ? <div role="alert" className="mt-4 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div> : null}
          <button type="button" onClick={() => void handleSubmit()} disabled={!selectedMood || loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-45">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}{loading ? 'Saving check-in…' : 'Save and talk with Aura'}{!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Aura offers supportive conversation, not medical diagnosis or emergency care.</div>
        </section>
      </div>
    </div>
  );
};
