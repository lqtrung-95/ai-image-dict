import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_ROUTES } from './constants';
import { supabase } from './supabase-client';

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://ai-image-dict.vercel.app') {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(async (config) => {
      console.log('[API] Request to:', config.url);

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[API] Session error:', error);
        }

        const token = data.session?.access_token;
        console.log('[API] Token exists:', !!token);

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('[API] Added Authorization header');
        }
      } catch (e) {
        console.error('[API] Failed to get auth headers:', e);
      }

      console.log('[API] Request headers:', config.headers);
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log('[API] Response status:', response.status);
        return response;
      },
      (error: AxiosError) => {
        console.log('[API] Response error:', error.response?.status, error.response?.data);
        const apiError: ApiError = {
          message: (error.response?.data as any)?.error || error.message || 'An error occurred',
          status: error.response?.status,
        };
        throw new Error(apiError.message);
      }
    );
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await this.client.get<T>(endpoint);
    return response.data;
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await this.client.post<T>(endpoint, body);
    return response.data;
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await this.client.put<T>(endpoint, body);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete<T>(endpoint);
    return response.data;
  }

  // Upload with FormData (for images)
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const response = await this.client.post<T>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
