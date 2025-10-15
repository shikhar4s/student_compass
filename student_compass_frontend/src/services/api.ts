const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || error.message || 'Request failed');
    }

    return response.json();
  }

  async signup(email: string, password: string, fullName: string) {
    return this.request('/auth/signup/', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout/', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me/');
  }

  async getMoods() {
    return this.request('/moods/');
  }

  async createMood(moodType: string, intensity: number, note?: string) {
    return this.request('/moods/', {
      method: 'POST',
      body: JSON.stringify({
        mood_type: moodType,
        intensity,
        note,
      }),
    });
  }

  async getConversations() {
    return this.request('/conversations/');
  }

  async createConversation(moodId: string, title: string) {
    return this.request('/conversations/', {
      method: 'POST',
      body: JSON.stringify({
        mood: moodId,
        title,
      }),
    });
  }

  async getMessages(conversationId: string) {
    return this.request(`/conversations/${conversationId}/messages/`);
  }

  async sendMessage(conversationId: string, message: string) {
    return this.request(`/conversations/${conversationId}/messages/`, {
      method: 'POST',
      body: JSON.stringify({ content: message }),
    });
  }

  async getHabits() {
    return this.request('/habits/');
  }

  async createHabit(title: string, description: string, color: string, targetDays: number = 7) {
    return this.request('/habits/', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        color,
        target_days: targetDays,
      }),
    });
  }

  async updateHabit(id: string, data: any) {
    return this.request(`/habits/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteHabit(id: string) {
    return this.request(`/habits/${id}/`, {
      method: 'DELETE',
    });
  }

  async getHabitCompletions(habitId: string) {
    return this.request(`/habits/${habitId}/completions/`);
  }

  async toggleHabitCompletion(habitId: string, date: string) {
    return this.request(`/habits/${habitId}/toggle_completion/`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  }

  async getJournalEntries() {
    return this.request('/journal/');
  }

  async createJournalEntry(title: string, content: string, isLocked: boolean = false) {
    return this.request('/journal/', {
      method: 'POST',
      body: JSON.stringify({
        title,
        content,
        is_locked: isLocked,
      }),
    });
  }

  async updateJournalEntry(id: string, title: string, content: string, isLocked: boolean = false) {
    return this.request(`/journal/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        title,
        content,
        is_locked: isLocked,
      }),
    });
  }

  async deleteJournalEntry(id: string) {
    return this.request(`/journal/${id}/`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
