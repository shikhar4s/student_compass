import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Smile, Frown, Angry, CloudRain, Zap, TrendingDown, MessageCircle } from 'lucide-react';

interface MoodTrackerProps {
  onStartChat: (moodId: string, moodType: string) => void;
}

const moods = [
  { type: 'Happy', icon: Smile, color: 'bg-yellow-400', hoverColor: 'hover:bg-yellow-500', emoji: '😊' },
  { type: 'Sad', icon: Frown, color: 'bg-blue-400', hoverColor: 'hover:bg-blue-500', emoji: '😢' },
  { type: 'Angry', icon: Angry, color: 'bg-red-400', hoverColor: 'hover:bg-red-500', emoji: '😠' },
  { type: 'Depressed', icon: CloudRain, color: 'bg-gray-400', hoverColor: 'hover:bg-gray-500', emoji: '😔' },
  { type: 'Frustrated', icon: Zap, color: 'bg-orange-400', hoverColor: 'hover:bg-orange-500', emoji: '😤' },
  { type: 'Disappointed', icon: TrendingDown, color: 'bg-purple-400', hoverColor: 'hover:bg-purple-500', emoji: '😞' },
];

export const MoodTracker: React.FC<MoodTrackerProps> = ({ onStartChat }) => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMoodSubmit = async (moodType: string) => {
    if (!user) return;

    setLoading(true);
    setSelectedMood(moodType);

    try {
      const data = await api.createMood(moodType, intensity, note || undefined);
      onStartChat(data.id, moodType);
    } catch (error) {
      console.error('Error creating mood:', error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">How are you feeling today?</h1>
          <p className="text-lg text-gray-600">Select your mood and let's talk about it</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {moods.map((mood) => {
            const Icon = mood.icon;
            return (
              <button
                key={mood.type}
                onClick={() => handleMoodSubmit(mood.type)}
                disabled={loading}
                className={`${mood.color} ${mood.hoverColor} rounded-2xl p-8 transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="text-5xl">{mood.emoji}</div>
                  <Icon className="w-8 h-8 text-white" />
                  <span className="text-white font-bold text-lg">{mood.type}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Intensity Level: {intensity}/5
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Intense</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Add a note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              rows={4}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <MessageCircle className="w-5 h-5" />
            <p>Our AI companion will provide personalized support based on your mood</p>
          </div>
        </div>
      </div>
    </div>
  );
};
