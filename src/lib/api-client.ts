/**
 * API Client utility for handling native app and web API calls
 * In native app: Uses production API base URL
 * In web: Uses relative paths (same origin)
 */

// Check if running in Capacitor native app
const isNative = () => {
  return typeof window !== 'undefined' &&
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() === true;
};

// Get the API base URL
export const getApiBaseUrl = (): string => {
  if (isNative()) {
    // Native app uses production API
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ai-image-dict.vercel.app';
  }
  // Web uses relative paths
  return '';
};

// Make API request with correct base URL
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  return response;
}
