export const FREE_LIMITS = {
  guestAnalyses: 1,
  dailyAnalyses: 6,
  dailyTts: 50,
} as const;

export const PRO_PLAN = {
  name: 'Pro',
  monthlyPrice: '$4.99',
  annualPrice: '$39.99',
  annualSavings: 'Save 33%',
} as const;

export const PRO_FEATURES = [
  'Higher daily photo analysis limits',
  'Save unlimited vocabulary',
  'Unlimited practice sessions',
  'Story generation from photos',
  'Vocabulary import from articles and text',
  'Priority pronunciation playback',
] as const;
