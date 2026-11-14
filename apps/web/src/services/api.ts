/**
 * apps/web/src/services/api.ts
 * Centralized API Client for NEURO-SPEECH (M6).
 * Connects to the real backend at /api/v1 with Bearer token authentication.
 */

import { AuthUser, CommunicationHistoryItem, EEGSessionItem, AdminStats } from '../types';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('neuro_speech_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData && errorData.detail) {
        errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // Fallback to status text
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  return response.json();
}

export const api = {
  // Authentication
  auth: {
    async login(username: string, password: string): Promise<{ access_token: string; user_id: number; username: string; role: string; full_name: string }> {
      const res = await request<{ access_token: string; user_id: number; username: string; role: string; full_name: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('neuro_speech_token', res.access_token);
      localStorage.setItem('neuro_speech_user', JSON.stringify({
        id: res.user_id,
        username: res.username,
        role: res.role,
        full_name: res.full_name,
      }));
      return res;
    },

    async register(data: { username: string; email: string; password: string; full_name: string; role?: string }): Promise<any> {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getMe(): Promise<AuthUser> {
      return request<AuthUser>('/auth/me');
    },

    async forgotPassword(email: string): Promise<any> {
      return request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async resetPassword(email: string, token: string, new_password: string): Promise<any> {
      return request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token, new_password }),
      });
    },

    logout() {
      localStorage.removeItem('neuro_speech_token');
      localStorage.removeItem('neuro_speech_user');
    },

    getToken(): string | null {
      return localStorage.getItem('neuro_speech_token');
    },

    getCurrentUser(): AuthUser | null {
      const userStr = localStorage.getItem('neuro_speech_user');
      if (!userStr) return null;
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    },
  },

  // Admin
  admin: {
    async getStats(): Promise<AdminStats> {
      return request<AdminStats>('/admin/stats');
    },

    async listUsers(params: { q?: string; role?: string; limit?: number; offset?: number } = {}): Promise<{ total: number; items: AuthUser[] }> {
      const query = new URLSearchParams();
      if (params.q) query.set('q', params.q);
      if (params.role) query.set('role', params.role);
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      return request<{ total: number; items: AuthUser[] }>(`/admin/users?${query.toString()}`);
    },

    async updateUserRole(userId: number, role: string): Promise<any> {
      return request(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },

    async updateUserStatus(userId: number, isActive: boolean): Promise<any> {
      return request(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      });
    },

    async getSettings(): Promise<{ settings: Record<string, string> }> {
      return request<{ settings: Record<string, string> }>('/admin/settings');
    },

    async updateSetting(key: string, value: string): Promise<any> {
      return request('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ key, value }),
      });
    },
  },

  // Patients
  patients: {
    async list(): Promise<any[]> {
      return request<any[]>('/patients');
    },

    async create(data: { code: string; birth_year: number; handedness: string; notes?: string }): Promise<any> {
      return request('/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id: number, data: { birth_year?: number; handedness?: string; notes?: string }): Promise<any> {
      return request(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async delete(id: number): Promise<any> {
      return request(`/patients/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Models
  models: {
    async list(): Promise<any[]> {
      return request<any[]>('/models');
    },

    async activate(id: string): Promise<any> {
      return request(`/models/${id}/activate`, {
        method: 'POST',
      });
    },

    async triggerRetrain(): Promise<{ job_id: string; message: string }> {
      return request<{ job_id: string; message: string }>('/models/retrain', {
        method: 'POST',
      });
    },

    async getJobStatus(jobId: string): Promise<any> {
      return request(`/jobs/${jobId}`);
    },
  },

  // Communication History
  communication: {
    async list(params: { mode?: string; limit?: number; offset?: number } = {}): Promise<{ total: number; items: CommunicationHistoryItem[] }> {
      const query = new URLSearchParams();
      if (params.mode) query.set('mode', params.mode);
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      return request<{ total: number; items: CommunicationHistoryItem[] }>(`/communication/history?${query.toString()}`);
    },

    async record(data: {
      confirmed_text: string;
      mode?: string;
      tts_status?: string;
      duration_s?: number;
      data_source?: string;
      model_version?: string;
      reps?: number;
      patient_id?: number;
    }): Promise<any> {
      return request('/communication/history', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Sessions
  sessions: {
    async list(params: { limit?: number; offset?: number } = {}): Promise<{ total: number; items: EEGSessionItem[] }> {
      const query = new URLSearchParams();
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      return request<{ total: number; items: EEGSessionItem[] }>(`/sessions?${query.toString()}`);
    },

    async record(data: {
      patient_id?: number;
      session_type: string;
      mode_badge: string;
      split_name?: string;
      accuracy?: number;
      duration_s?: number;
      notes?: string;
    }): Promise<any> {
      return request('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Survival Phrases
  survival: {
    async list(): Promise<any[]> {
      return request<any[]>('/survival/phrases');
    },

    async trigger(slot: string, options: { bypass_confirm?: boolean; staff_override?: boolean } = {}): Promise<any> {
      return request(`/survival/trigger/${slot}`, {
        method: 'POST',
        body: JSON.stringify(options),
      });
    },
  },

  // Audit Logs
  audit: {
    async list(limit = 100): Promise<any[]> {
      return request<any[]>(`/audit/logs?limit=${limit}`);
    },
  },

  // Datasets
  datasets: {
    async inspect(): Promise<any> {
      return request('/datasets/inspect');
    },
  },
};
