import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BookOpen, Edit3, FileText, Loader2, Lock, Plus, Save, Search, Trash2, Unlock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface JournalEntry { id: string; title: string; content: string; sentiment: string | null; is_locked: boolean; created_at: string; updated_at: string; }

const formatDate = (value: string, detailed = false) => new Intl.DateTimeFormat('en-IN', detailed ? { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

export const Journal: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const loadEntries = useCallback(async (selectId?: string) => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const data = await api.getJournalEntries();
      setEntries(data);
      if (selectId) setSelectedEntry(data.find((entry: JournalEntry) => entry.id === selectId) || null);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Your journal could not be loaded.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void loadEntries(); }, [loadEntries]);

  const filteredEntries = entries.filter((entry) => `${entry.title} ${entry.content}`.toLowerCase().includes(query.trim().toLowerCase()));

  const handleDelete = async (entry: JournalEntry) => {
    if (!window.confirm(`Delete “${entry.title}”? This cannot be undone.`)) return;
    try { await api.deleteJournalEntry(entry.id); setEntries((current) => current.filter((item) => item.id !== entry.id)); setSelectedEntry(null); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'That entry could not be deleted.'); }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">A place to pause</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Journal</h1><p className="mt-3 text-slate-600">Capture the thought. You can make sense of it later.</p></div>
        <button type="button" onClick={() => { setEditingEntry(null); setSelectedEntry(null); }} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"><Plus className="h-5 w-5" />New entry</button>
      </div>

      {error ? <div role="alert" className="mt-5 flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div> : null}

      <div className="mt-7 grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search entries" aria-label="Search journal entries" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></div>
          <div className="mt-4 flex items-center justify-between"><h2 className="text-sm font-black text-slate-900">Your entries</h2><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">{filteredEntries.length}</span></div>
          {loading ? <div className="flex min-h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div> : filteredEntries.length === 0 ? <div className="py-10 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-500">{query ? 'No matching entries' : 'No entries yet'}</p></div> : (
            <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 lg:max-h-none lg:overflow-visible">
              {filteredEntries.map((entry) => <button key={entry.id} type="button" onClick={() => { setSelectedEntry(entry); setEditingEntry(undefined); }} className={`rounded-2xl border p-3 text-left transition ${selectedEntry?.id === entry.id ? 'border-indigo-200 bg-indigo-50' : 'border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white'}`}>
                <div className="flex items-center gap-2"><h3 className="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-900">{entry.title}</h3>{entry.is_locked ? <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : null}</div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{entry.content}</p><p className="mt-2 text-[11px] font-semibold text-slate-400">{formatDate(entry.updated_at)}</p>
              </button>)}
            </div>
          )}
        </aside>

        <section className="min-h-[440px]">
          {editingEntry !== undefined ? <JournalEditor entry={editingEntry} onCancel={() => setEditingEntry(undefined)} onSave={async (id) => { await loadEntries(id); setEditingEntry(undefined); }} /> : selectedEntry ? (
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div><div className="flex items-center gap-2"><h2 className="text-balance text-2xl font-black text-slate-950 sm:text-3xl">{selectedEntry.title}</h2>{selectedEntry.is_locked ? <Lock className="h-5 w-5 shrink-0 text-indigo-500" aria-label="Marked private" /> : null}</div><p className="mt-2 text-sm text-slate-400">Updated {formatDate(selectedEntry.updated_at, true)}</p></div>
                <div className="flex gap-2"><button type="button" onClick={() => setEditingEntry(selectedEntry)} className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100"><Edit3 className="h-4 w-4" />Edit</button><button type="button" onClick={() => void handleDelete(selectedEntry)} className="rounded-xl bg-rose-50 p-2.5 text-rose-600 hover:bg-rose-100" aria-label="Delete entry"><Trash2 className="h-4 w-4" /></button></div>
              </div>
              <p className="whitespace-pre-wrap py-7 text-[15px] leading-8 text-slate-700">{selectedEntry.content}</p>
            </article>
          ) : (
            <div className="flex min-h-[440px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50"><BookOpen className="h-8 w-8 text-amber-600" /></span><h2 className="mt-5 text-xl font-black">Your thoughts, in your words</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Select an entry to read it, or start with what is on your mind today.</p><button type="button" onClick={() => setEditingEntry(null)} className="mt-5 font-extrabold text-indigo-600">Write a new entry →</button></div>
          )}
        </section>
      </div>
    </div>
  );
};

interface JournalEditorProps { entry: JournalEntry | null; onSave: (id: string) => void | Promise<void>; onCancel: () => void; }
const JournalEditor: React.FC<JournalEditorProps> = ({ entry, onSave, onCancel }) => {
  const [title, setTitle] = useState(entry?.title || ''); const [content, setContent] = useState(entry?.content || ''); const [isLocked, setIsLocked] = useState(entry?.is_locked || false); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const handleSave = async () => { if (!content.trim()) return; setSaving(true); setError(''); try { const saved = entry ? await api.updateJournalEntry(entry.id, title.trim() || 'Untitled entry', content.trim(), isLocked) : await api.createJournalEntry(title.trim() || 'Untitled entry', content.trim(), isLocked); await onSave(saved.id); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'The entry could not be saved.'); } finally { setSaving(false); } };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600">{entry ? 'Editing entry' : 'New reflection'}</p><h2 className="mt-1 text-2xl font-black">{entry ? entry.title : 'What is on your mind?'}</h2></div><button type="button" onClick={onCancel} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:text-slate-900" aria-label="Close editor"><X className="h-5 w-5" /></button></div>
      <div className="mt-6 space-y-4"><div><label htmlFor="journal-title" className="sr-only">Entry title</label><input id="journal-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Give this entry a title" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-extrabold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></div><div><label htmlFor="journal-content" className="sr-only">Entry content</label><textarea id="journal-content" autoFocus value={content} onChange={(event) => setContent(event.target.value)} maxLength={10000} rows={14} placeholder="Start writing without judging the first sentence…" className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-7 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /><p className="mt-1 text-right text-xs text-slate-400">{content.length.toLocaleString()}/10,000</p></div></div>
      <button type="button" onClick={() => setIsLocked((value) => !value)} aria-pressed={isLocked} className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${isLocked ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}{isLocked ? 'Marked private' : 'Mark as private'}</button>
      {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={onCancel} className="rounded-2xl bg-slate-100 px-4 py-3 font-extrabold text-slate-700">Cancel</button><button type="button" onClick={() => void handleSave()} disabled={saving || !content.trim()} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-extrabold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving…' : 'Save entry'}</button></div>
    </div>
  );
};
