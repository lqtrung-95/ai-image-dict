// Input validation utilities for API routes

export const ValidationError = class extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
};

// Sanitize string input
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') {
    throw new ValidationError('Invalid string input');
  }
  // Trim and limit length
  return input.trim().slice(0, maxLength);
}

// Validate email format
export function validateEmail(email: unknown): string {
  const str = sanitizeString(email, 254);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) {
    throw new ValidationError('Invalid email format');
  }
  return str.toLowerCase();
}

// Validate UUID format
export function validateUUID(id: unknown): string {
  const str = sanitizeString(id, 36);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(str)) {
    throw new ValidationError('Invalid UUID format');
  }
  return str;
}

// Validate integer within range
export function validateInteger(value: unknown, min?: number, max?: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ValidationError('Invalid integer');
  }
  if (min !== undefined && value < min) {
    throw new ValidationError(`Value must be at least ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new ValidationError(`Value must be at most ${max}`);
  }
  return value;
}

// Validate HSK level (1-6)
export function validateHSKLevel(level: unknown): number | null {
  if (level === null || level === undefined) return null;
  return validateInteger(level, 1, 6);
}

// Validate array
export function validateArray<T>(
  input: unknown,
  itemValidator: (item: unknown) => T,
  maxLength = 100
): T[] {
  if (!Array.isArray(input)) {
    throw new ValidationError('Invalid array input');
  }
  if (input.length > maxLength) {
    throw new ValidationError(`Array exceeds maximum length of ${maxLength}`);
  }
  return input.map(itemValidator);
}

// Validate Chinese word
export function validateChineseWord(word: unknown): string {
  const str = sanitizeString(word, 50);
  // Basic check for Chinese characters
  if (!/[\u4e00-\u9fff]/.test(str)) {
    throw new ValidationError('Word must contain Chinese characters');
  }
  return str;
}

// Validate pinyin
export function validatePinyin(pinyin: unknown): string {
  const str = sanitizeString(pinyin, 100);
  // Allow letters, tone marks (various Unicode ranges), tone numbers, and spaces
  // This covers: standard letters, accented vowels for tones, spaces, and tone numbers (1-4)
  if (!/^[a-zA-Z\u0101-\u0128\u014d-\u016b\u01d0-\u01d4\u01d6-\u01dc\u1e3f\u0144\u01f9\s\d]*$/i.test(str)) {
    throw new ValidationError('Invalid pinyin format');
  }
  return str;
}

// Validate and sanitize search query
export function validateSearchQuery(query: unknown): string {
  const str = sanitizeString(query, 100);
  // Remove SQL special characters
  return str.replace(/[%_\\]/g, '');
}
