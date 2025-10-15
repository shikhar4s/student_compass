import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { BookOpen, Plus, Trash2, Lock, Unlock, Save, X, Edit3 } from 'lucide-react';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  sentiment: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export const Journal: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;

    try {
      const data = await api.getJournalEntries();
      setEntries(data);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }

    setLoading(false);
  };

  const handleNewEntry = () => {
    setShowNewEntry(true);
    setSelectedEntry(null);
    setIsEditing(true);
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowNewEntry(false);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Journal</h1>
              <p className="text-gray-600">Your private space for reflection</p>
            </div>
          </div>
          <button
            onClick={handleNewEntry}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Entry
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Entries</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No entries yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleSelectEntry(entry)}
                    className={`w-full text-left p-4 rounded-xl transition ${
                      selectedEntry?.id === entry.id
                        ? 'bg-orange-100 border-2 border-orange-600'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate flex-1">
                        {entry.title}
                      </h3>
                      {entry.is_locked && (
                        <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(entry.created_at)}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {entry.content}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {showNewEntry ? (
              <JournalEditor
                entry={null}
                onSave={loadEntries}
                onCancel={() => setShowNewEntry(false)}
              />
            ) : selectedEntry ? (
              isEditing ? (
                <JournalEditor
                  entry={selectedEntry}
                  onSave={() => {
                    loadEntries();
                    setIsEditing(false);
                  }}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <JournalViewer
                  entry={selectedEntry}
                  onEdit={() => setIsEditing(true)}
                  onDelete={() => {
                    loadEntries();
                    setSelectedEntry(null);
                  }}
                />
              )
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select an entry or create a new one
                </h3>
                <p className="text-gray-500">
                  Your thoughts and reflections will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface JournalEditorProps {
  entry: JournalEntry | null;
  onSave: () => void;
  onCancel: () => void;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ entry, onSave, onCancel }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [isLocked, setIsLocked] = useState(entry?.is_locked || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !content.trim()) return;

    setSaving(true);

    try {
      if (entry) {
        await api.updateJournalEntry(
          entry.id,
          title.trim() || 'Untitled Entry',
          content.trim(),
          isLocked
        );
      } else {
        await api.createJournalEntry(
          title.trim() || 'Untitled Entry',
          content.trim(),
          isLocked
        );
      }
      onSave();
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }

    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {entry ? 'Edit Entry' : 'New Entry'}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`p-2 rounded-lg transition ${
              isLocked ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={isLocked ? 'Locked' : 'Unlocked'}
          >
            {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry title..."
            className="w-full text-xl font-semibold px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts..."
            className="w-full h-96 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface JournalViewerProps {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}

const JournalViewer: React.FC<JournalViewerProps> = ({ entry, onEdit, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    setDeleting(true);
    try {
      await api.deleteJournalEntry(entry.id);
      onDelete();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
    setDeleting(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{entry.title}</h2>
            {entry.is_locked && (
              <Lock className="w-5 h-5 text-orange-600" />
            )}
          </div>
          <p className="text-sm text-gray-500">
            {new Date(entry.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
            title="Edit"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="prose max-w-none">
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {entry.content}
        </p>
      </div>
    </div>
  );
};
