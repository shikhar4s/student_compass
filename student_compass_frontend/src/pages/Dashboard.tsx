import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Calendar, BookOpen, LogOut, Sparkles } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();

  const features = [
    {
      id: 'mood',
      title: 'Mood Tracker',
      description: 'Track your emotions and chat with AI support',
      icon: Brain,
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-pink-50',
    },
    {
      id: 'habits',
      title: 'Habit Tracker',
      description: 'Build consistency with daily habit tracking',
      icon: Calendar,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'journal',
      title: 'Journal',
      description: 'Write and reflect on your daily experiences',
      icon: BookOpen,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Student Compass</h1>
              <p className="text-sm text-gray-600">Your intelligent companion</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome back! 👋
          </h2>
          <p className="text-lg text-gray-600">
            Choose a feature to enhance your academic journey and wellbeing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => onNavigate(feature.id)}
                className={`${feature.bgColor} p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 text-left`}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            About Student Compass
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                AI-Powered Support
              </h4>
              <p className="text-sm text-gray-600">
                Get personalized emotional support and academic guidance powered by
                Google Gemini AI
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Build Better Habits
              </h4>
              <p className="text-sm text-gray-600">
                Track your daily habits with beautiful visualizations and maintain
                your streaks
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Personal Journal
              </h4>
              <p className="text-sm text-gray-600">
                Write private journal entries with optional locking for complete
                privacy
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
