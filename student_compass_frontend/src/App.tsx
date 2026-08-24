import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { MoodTracker } from './pages/MoodTracker';
import { Chatbot } from './pages/Chatbot';
import { HabitTracker } from './pages/HabitTracker';
import { Journal } from './pages/Journal';
import { AppShell, type AppPage } from './components/AppShell';

function AppContent() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentPage, setCurrentPage] = useState<AppPage | 'chat'>('dashboard');
  const [chatState, setChatState] = useState<{ moodId: string; moodType: string } | null>(null);

  const handleStartChat = (moodId: string, moodType: string) => {
    setChatState({ moodId, moodType });
    setCurrentPage('chat');
  };

  const handleBackFromChat = () => {
    setChatState(null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: AppPage) => setCurrentPage(page);

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

  if (currentPage === 'chat' && chatState) {
    return (
      <Chatbot
        moodId={chatState.moodId}
        moodType={chatState.moodType}
        onBack={handleBackFromChat}
      />
    );
  }

  const shellPage: AppPage = currentPage === 'chat' ? 'dashboard' : currentPage;
  return (
    <AppShell currentPage={shellPage} onNavigate={handleNavigate}>
      {currentPage === 'dashboard' ? <Dashboard onNavigate={handleNavigate} /> : null}
      {currentPage === 'mood' ? <MoodTracker onStartChat={handleStartChat} /> : null}
      {currentPage === 'habits' ? <HabitTracker /> : null}
      {currentPage === 'journal' ? <Journal /> : null}
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
