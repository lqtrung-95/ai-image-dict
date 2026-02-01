import { API_ROUTES } from './constants';
import { supabase } from './supabase-client';

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://ai-image-dict.vercel.app') {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      console.log('[API] Fetching session from Supabase...');
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[API] Session error:', error);
      }
      const token = data.session?.access_token;
      console.log('[API] Token exists:', !!token);
      console.log('[API] Token length:', token ? token.length : 0);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[API] Added Authorization header');
      } else {
        console.log('[API] No token available');
      }

      return headers;
    } catch (e) {
      console.error('[API] Failed to get auth headers:', e);
      return { 'Content-Type': 'application/json' };
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log('[API] Response status:', response.status);
    console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[API] Error response body:', errorText);
      let error: ApiError;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText || 'An error occurred', status: response.status };
      }
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    console.log('[API] GET', endpoint, 'Headers:', headers);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: 'omit', // Don't send cookies, use Bearer token instead
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      credentials: 'omit',
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      credentials: 'omit',
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
      credentials: 'omit',
    });
    return this.handleResponse<T>(response);
  }

  // Upload with FormData (for images)
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'omit',
      body: formData,
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
