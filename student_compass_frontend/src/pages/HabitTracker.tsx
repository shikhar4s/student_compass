import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Plus, Check, BarChart3, Calendar } from 'lucide-react';

interface Habit {
  id: string;
  title: string;
  description: string | null;
  color: string;
  target_days: number;
  completions: { completed_date: string }[];
}

export const HabitTracker: React.FC = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadHabits();
  }, [user?.id]);

  const loadHabits = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const habitsData = await api.getHabits();
      setHabits(habitsData);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabitCompletion = async (habitId: string) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const originalHabits = [...habits];
    const isCurrentlyCompleted = habits.find(h => h.id === habitId)?.completions.some(c => c.completed_date === today);
    setHabits(prev =>
      prev.map(h =>
        h.id === habitId
          ? {
              ...h,
              completions: isCurrentlyCompleted
                ? h.completions.filter(c => c.completed_date !== today)
                : [...h.completions, { completed_date: today }],
            }
          : h
      )
    );
    try {
      const response = await api.toggleHabitCompletion(habitId, today);
      if (response?.data) {
        setHabits(prev =>
          prev.map(h => (h.id === habitId ? response.data : h))
        );
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      setHabits(originalHabits);
    }
  };

  const handleHabitAdded = (newHabit: Habit) => {
    setHabits(prev => [...prev, newHabit]);
  };

  const getStreakGrid = (completions: { completed_date: string }[]) => {
    const grid = [];
    const today = new Date();
    const completionSet = new Set(completions.map(c => c.completed_date));
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      grid.push({ date: dateStr, completed: completionSet.has(dateStr) });
    }
    return grid;
  };

  const getCurrentStreak = (completions: { completed_date: string }[]) => {
    let streak = 0;
    const today = new Date();
    const completionSet = new Set(completions.map(c => c.completed_date));
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (completionSet.has(dateStr)) streak++;
      else break;
    }
    return streak;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Habits</h1>
            <p className="text-gray-400">Build consistency, one day at a time</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Add Habit
          </button>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No habits yet</h3>
            <p className="text-gray-500">Start building better habits today!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {habits.map((habit) => {
              const streakGrid = getStreakGrid(habit.completions);
              const currentStreak = getCurrentStreak(habit.completions);
              const today = new Date().toISOString().split('T')[0];
              const isCompletedToday = habit.completions.some((c) => c.completed_date === today);
              return (
                <div
                  key={habit.id}
                  className="rounded-2xl p-6 shadow-2xl"
                  style={{ backgroundColor: habit.color + '20' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{habit.title}</h3>
                      {habit.description && <p className="text-sm text-gray-400">{habit.description}</p>}
                    </div>
                    <button
                      onClick={() => toggleHabitCompletion(habit.id)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
                        isCompletedToday ? 'bg-green-500' : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <Check className={`w-6 h-6 ${isCompletedToday ? 'text-white' : 'text-gray-500'}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{currentStreak} day streak</span>
                  </div>
                  <div className="grid grid-cols-10 gap-1.5">
                    {streakGrid.map((day, idx) => (
                      <div
                        key={idx}
                        className={`aspect-square rounded ${day.completed ? 'opacity-100' : 'bg-gray-800 opacity-30'}`}
                        style={{ backgroundColor: day.completed ? habit.color : undefined }}
                        title={day.date}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} onAdd={handleHabitAdded} />}
      </div>
    </div>
  );
};

interface AddHabitModalProps {
  onClose: () => void;
  onAdd: (newHabit: Habit) => void;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ onClose, onAdd }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);

  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setLoading(true);
    try {
      const newHabit = await api.createHabit(title.trim(), description.trim(), color);
      onAdd(newHabit);
      onClose();
    } catch (error) {
      console.error('Error creating habit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Add New Habit</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Habit Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Exercise, Study, Meditate"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Complete at least one lecture a day"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-3">Color</label>
            <div className="flex gap-3">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full transition-all transform ${
                    color === c ? 'scale-125 ring-4 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
