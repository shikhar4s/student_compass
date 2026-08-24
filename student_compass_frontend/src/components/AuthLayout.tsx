import React from 'react';
import { BookOpen, Brain, CalendarCheck2, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

const benefits = [
  { icon: Brain, title: 'Understand your mood', text: 'Check in, reflect, and talk with Aura.' },
  { icon: CalendarCheck2, title: 'Build lasting habits', text: 'Turn small daily wins into momentum.' },
  { icon: BookOpen, title: 'Keep a private journal', text: 'Create space for honest reflection.' },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({ eyebrow, title, description, children }) => (
  <div className="min-h-screen bg-[#f4f7ff] p-3 sm:p-5 lg:p-6">
    <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-indigo-200/40 sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-[#171a3b] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Sparkles className="h-6 w-6 text-cyan-300" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-extrabold">Student Compass</p>
              <p className="text-xs text-indigo-200">Your everyday wellbeing companion</p>
            </div>
          </div>
          <div className="mt-20 max-w-xl">
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">One calm space for students</span>
            <h2 className="mt-6 text-balance text-5xl font-black leading-[1.08] tracking-tight">Make room for progress, without losing yourself.</h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-indigo-100/80">Bring your mood, habits, and thoughts together in a simple daily workspace designed around student life.</p>
          </div>
        </div>
        <div className="relative grid gap-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><Icon className="h-5 w-5 text-cyan-300" aria-hidden="true" /></span>
                <div><p className="font-bold">{benefit.title}</p><p className="text-sm text-indigo-100/65">{benefit.text}</p></div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200"><Sparkles className="h-5 w-5 text-white" aria-hidden="true" /></span>
              <span className="font-extrabold text-slate-900">Student Compass</span>
            </div>
          </div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-600">{eyebrow}</p>
          <h1 className="mt-3 text-balance text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 leading-7 text-slate-500">{description}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Your personal entries stay linked to your account.</div>
        </div>
      </section>
    </div>
  </div>
);
