const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const getErrorMessage = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return 'Request failed. Please try again.';
  const data = payload as Record<string, unknown>;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  const firstFieldError = Object.values(data).find((value) => Array.isArray(value) && typeof value[0] === 'string');
  return Array.isArray(firstFieldError) ? firstFieldError[0] : 'Request failed. Please try again.';
};

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorPayload: unknown = await response.json().catch(() => null);
      throw new Error(getErrorMessage(errorPayload));
    }

    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type');
    return contentType?.includes('application/json') ? response.json() : response.text();
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

  async updateHabit(id: string, data: Record<string, unknown>) {
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
