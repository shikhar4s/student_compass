import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Bot, Loader2, RefreshCw, Send, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface ChatbotProps { moodId: string; moodType: string; onBack: () => void; }
interface Message { id: string; role: 'user' | 'assistant'; content: string; created_at: string; }

export const Chatbot: React.FC<ChatbotProps> = ({ moodId, moodType, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initHasRun = useRef(false);

  const initializeConversation = useCallback(async () => {
    if (!user) return;
    setInitializing(true); setError(''); setMessages([]);
    try {
      const conversation = await api.createConversation(moodId, `${moodType} check-in`);
      setConversationId(conversation.id);
      setMessages(await api.getMessages(conversation.id));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Aura could not start the conversation.'); }
    finally { setInitializing(false); }
  }, [moodId, moodType, user]);

  useEffect(() => {
    if (import.meta.env.DEV && initHasRun.current) return;
    initHasRun.current = true;
    void initializeConversation();
  }, [initializeConversation]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const handleSendMessage = async () => {
    const content = input.trim();
    if (!content || !conversationId || !user || sending) return;
    setInput(''); setSending(true); setError('');
    const optimistic: Message = { id: `temp-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString() };
    setMessages((current) => [...current, optimistic]);
    try { setMessages(await api.sendMessage(conversationId, content)); }
    catch (requestError) { setMessages((current) => current.filter((message) => message.id !== optimistic.id)); setInput(content); setError(requestError instanceof Error ? requestError.message : 'Your message could not be sent.'); }
    finally { setSending(false); }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={onBack} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Back to dashboard"><ArrowLeft className="h-5 w-5" /></button>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-200"><Bot className="h-5 w-5 text-white" /></span>
          <div className="min-w-0"><h1 className="truncate font-black text-slate-900">Aura</h1><p className="truncate text-xs text-slate-500">Supporting your {moodType.toLowerCase()} check-in</p></div>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Ready to listen</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-7">
        <div className="mx-auto max-w-4xl space-y-5">
          {initializing ? <div className="flex min-h-64 flex-col items-center justify-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /><p className="mt-3 text-sm font-bold">Starting a supportive conversation…</p></div> : null}
          {!initializing && error && messages.length === 0 ? <div className="mx-auto max-w-md rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-sm"><AlertCircle className="mx-auto h-8 w-8 text-rose-500" /><h2 className="mt-3 font-black">Aura is having trouble connecting</h2><p className="mt-2 text-sm text-slate-500">{error}</p><button type="button" onClick={() => void initializeConversation()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white"><RefreshCw className="h-4 w-4" />Try again</button></div> : null}
          {messages.map((message) => (
            <div key={message.id} className={`flex items-end gap-2 sm:gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${message.role === 'user' ? 'bg-slate-800' : 'bg-indigo-600'}`}>{message.role === 'user' ? <UserIcon className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}</span>
              <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[72%] sm:px-5 ${message.role === 'user' ? 'rounded-br-md bg-indigo-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}><p className="whitespace-pre-wrap">{message.content}</p></div>
            </div>
          ))}
          {sending ? <div className="flex items-end gap-2 sm:gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 sm:h-9 sm:w-9"><Bot className="h-4 w-4 text-white" /></span><div className="rounded-3xl rounded-bl-md border border-slate-200 bg-white px-5 py-4 shadow-sm"><span className="flex gap-1" aria-label="Aura is typing"><span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" /><span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:120ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:240ms]" /></span></div></div> : null}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white px-3 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto max-w-4xl">
          {error && messages.length > 0 ? <p role="alert" className="mb-2 flex items-center gap-2 text-xs font-semibold text-rose-600"><AlertCircle className="h-3.5 w-3.5" />{error}</p> : null}
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSendMessage(); } }} disabled={initializing || !conversationId} rows={1} maxLength={2000} placeholder="Share what is on your mind…" className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed" />
            <button type="button" onClick={() => void handleSendMessage()} disabled={sending || initializing || !input.trim() || !conversationId} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">{sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5" />Aura is supportive AI, not a replacement for professional or emergency help.</p>
        </div>
      </footer>
    </div>
  );
};
