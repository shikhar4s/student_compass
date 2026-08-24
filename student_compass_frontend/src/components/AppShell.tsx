import React from 'react';
import { BookOpen, Brain, CalendarDays, LayoutDashboard, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export type AppPage = 'dashboard' | 'mood' | 'habits' | 'journal';

interface AppShellProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  children: React.ReactNode;
}

const navigation = [
  { id: 'dashboard' as const, label: 'Overview', icon: LayoutDashboard },
  { id: 'mood' as const, label: 'Mood', icon: Brain },
  { id: 'habits' as const, label: 'Habits', icon: CalendarDays },
  { id: 'journal' as const, label: 'Journal', icon: BookOpen },
];

export const AppShell: React.FC<AppShellProps> = ({ currentPage, onNavigate, children }) => {
  const { user, signOut } = useAuth();
  const initials = (user?.full_name || user?.email || 'SC')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Go to dashboard"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
              <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">Student Compass</span>
              <span className="hidden text-xs text-slate-500 sm:block">Plan better. Feel better.</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 rounded-2xl bg-slate-100 p-1 md:flex" aria-label="Primary navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden text-right lg:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-800">{user?.full_name || 'Student'}</p>
              <p className="max-w-40 truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-700">
              {initials}
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl shadow-slate-300/60 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition ${
                active ? 'bg-indigo-600 text-white' : 'text-slate-500'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
