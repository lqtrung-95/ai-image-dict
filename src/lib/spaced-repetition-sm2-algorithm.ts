/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak.
 * This implementation uses a 4-button rating system (Anki-style):
 *   1 = Again (complete failure)
 *   2 = Hard (correct with difficulty)
 *   3 = Good (correct with some effort)
 *   4 = Easy (perfect recall)
 */

export type SrsRating = 1 | 2 | 3 | 4;

export interface SrsState {
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  correctStreak: number;
}

export interface SrsResult extends SrsState {
  nextReviewDate: Date;
  isLearned: boolean;
}

// Minimum easiness factor to prevent intervals from shrinking too quickly
const MIN_EASINESS_FACTOR = 1.3;

// Number of days threshold to consider a word "learned/mastered"
const MASTERED_INTERVAL_THRESHOLD = 21;

/**
 * Calculate the new SRS state after a review
 *
 * @param currentState - Current SRS state of the vocabulary item
 * @param rating - User's rating (1-4)
 * @returns New SRS state with next review date
 */
export function calculateNextReview(
  currentState: SrsState,
  rating: SrsRating
): SrsResult {
  let { easinessFactor, intervalDays, repetitions, correctStreak } = currentState;

  // Convert 4-button rating to SM-2 quality (0-5 scale)
  // Rating 1 (Again) -> quality 0-1
  // Rating 2 (Hard) -> quality 2-3
  // Rating 3 (Good) -> quality 4
  // Rating 4 (Easy) -> quality 5
  const quality = ratingToQuality(rating);

  // Update easiness factor based on quality
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEasinessFactor = Math.max(
    MIN_EASINESS_FACTOR,
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate new interval based on rating
  if (rating === 1) {
    // Again: Reset to beginning
    intervalDays = 1;
    repetitions = 0;
    correctStreak = 0;
  } else {
    // Correct answer (Hard/Good/Easy)
    correctStreak++;

    if (repetitions === 0) {
      // First successful review - differentiate by rating
      if (rating === 2) intervalDays = 2;      // Hard: 2 days
      else if (rating === 3) intervalDays = 4; // Good: 4 days
      else intervalDays = 7;                   // Easy: 7 days
    } else if (repetitions === 1) {
      // Second successful review
      if (rating === 2) intervalDays = 4;      // Hard: 4 days
      else if (rating === 3) intervalDays = 7; // Good: 7 days
      else intervalDays = 14;                  // Easy: 14 days
    } else {
      // Subsequent reviews: multiply by easiness factor
      intervalDays = Math.round(intervalDays * newEasinessFactor);
      // Apply rating-specific modifiers
      if (rating === 2) {
        intervalDays = Math.max(1, Math.round(intervalDays * 0.85));
      } else if (rating === 4) {
        intervalDays = Math.round(intervalDays * 1.3);
      }
    }

    repetitions++;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
  nextReviewDate.setHours(0, 0, 0, 0);

  // Check if word is considered "learned/mastered"
  const isLearned = intervalDays >= MASTERED_INTERVAL_THRESHOLD;

  return {
    easinessFactor: newEasinessFactor,
    intervalDays,
    repetitions,
    correctStreak,
    nextReviewDate,
    isLearned,
  };
}

/**
 * Convert 4-button rating to SM-2 quality score (0-5)
 */
function ratingToQuality(rating: SrsRating): number {
  switch (rating) {
    case 1: return 1; // Again -> low quality
    case 2: return 3; // Hard -> medium quality
    case 3: return 4; // Good -> good quality
    case 4: return 5; // Easy -> perfect quality
    default: return 3;
  }
}

/**
 * Get the default SRS state for a new vocabulary item
 */
export function getDefaultSrsState(): SrsState {
  return {
    easinessFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    correctStreak: 0,
  };
}

/**
 * Check if a vocabulary item is due for review
 *
 * @param nextReviewDate - The scheduled review date
 * @returns true if the item should be reviewed today or earlier
 */
export function isDueForReview(nextReviewDate: Date | string | null): boolean {
  if (!nextReviewDate) return true;

  const reviewDate = typeof nextReviewDate === 'string'
    ? new Date(nextReviewDate)
    : nextReviewDate;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return reviewDate <= today;
}

/**
 * Get human-readable label for a rating
 */
export function getRatingLabel(rating: SrsRating): string {
  switch (rating) {
    case 1: return 'Again';
    case 2: return 'Hard';
    case 3: return 'Good';
    case 4: return 'Easy';
    default: return 'Unknown';
  }
}

/**
 * Get the color class for a rating button
 */
export function getRatingColor(rating: SrsRating): string {
  switch (rating) {
    case 1: return 'red';
    case 2: return 'orange';
    case 3: return 'green';
    case 4: return 'blue';
    default: return 'gray';
  }
}

/**
 * Estimate the next interval preview for each rating option
 * This helps users understand the consequences of their choice
 */
export function getIntervalPreviews(currentState: SrsState): Record<SrsRating, number> {
  return {
    1: 1, // Again always resets to 1 day
    2: calculateNextReview(currentState, 2).intervalDays,
    3: calculateNextReview(currentState, 3).intervalDays,
    4: calculateNextReview(currentState, 4).intervalDays,
  };
}

/**
 * Format interval days as human-readable text
 */
export function formatInterval(days: number): string {
  if (days === 0) return 'Now';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
