import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { MoodTracker } from './pages/MoodTracker';
import { Chatbot } from './pages/Chatbot';
import { HabitTracker } from './pages/HabitTracker';
import { Journal } from './pages/Journal';

function AppContent() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'mood' | 'chat' | 'habits' | 'journal'>('dashboard');
  const [chatState, setChatState] = useState<{ moodId: string; moodType: string } | null>(null);

  const handleStartChat = (moodId: string, moodType: string) => {
    setChatState({ moodId, moodType });
    setCurrentPage('chat');
  };

  const handleBackFromChat = () => {
    setChatState(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    if (page === 'mood' || page === 'habits' || page === 'journal') {
      setCurrentPage(page as any);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <Login onSwitchToSignup={() => setAuthMode('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  if (currentPage === 'mood') {
    return <MoodTracker onStartChat={handleStartChat} />;
  }

  if (currentPage === 'chat' && chatState) {
    return (
      <Chatbot
        moodId={chatState.moodId}
        moodType={chatState.moodType}
        onBack={handleBackFromChat}
      />
    );
  }

  if (currentPage === 'habits') {
    return (
      <div className="relative">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="fixed top-6 left-6 z-50 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-50 transition"
        >
          ← Back to Dashboard
        </button>
        <HabitTracker />
      </div>
    );
  }

  if (currentPage === 'journal') {
    return (
      <div className="relative">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="fixed top-6 left-6 z-50 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-50 transition"
        >
          ← Back to Dashboard
        </button>
        <Journal />
      </div>
    );
  }

  return <Dashboard onNavigate={handleNavigate} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
