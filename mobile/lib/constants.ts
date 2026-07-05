export const APP_NAME = 'Youreka'

export const COLORS = {
  bg: '#030712',
  card: '#111827',
  border: 'rgba(255,255,255,0.1)',
  primary: '#7c3aed',
  primaryLight: '#8b5cf6',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.5)',
  textFaint: 'rgba(255,255,255,0.3)',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
}

export const SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive'] as const
export const AGE_RANGES = ['Under 13', '13–17', '18–24', '25–34', '35+'] as const
export const CONCERNS = [
  'Acne & breakouts', 'Blackheads & pores', 'Oiliness', 'Dryness',
  'Redness', 'Dark spots', 'Uneven skin tone', 'Dullness', 'Fine lines', 'Under-eye circles',
] as const
export const SENSITIVITIES = ['Fragrance', 'Alcohol', 'Essential oils', 'Dyes / colorants', 'Latex'] as const
export const BUDGETS = [
  { value: 'low', label: 'Budget-friendly (under $15)' },
  { value: 'medium', label: 'Mid-range ($15–$40)' },
  { value: 'high', label: 'Premium ($40+)' },
] as const
export const ROUTINES = [
  { value: 'minimal', label: 'Minimal (2–3 steps)' },
  { value: 'moderate', label: 'Moderate (4–6 steps)' },
  { value: 'extensive', label: 'Extensive (7+ steps)' },
] as const
