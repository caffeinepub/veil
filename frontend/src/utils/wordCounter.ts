export const MINIMUM_WORD_COUNT = 24;

export function countWords(text: string): number {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function hasMinimumWords(text: string, min: number = MINIMUM_WORD_COUNT): boolean {
  return countWords(text) >= min;
}

export function needsMinimumWords(emotionType: string): boolean {
  return emotionType === 'confess' || emotionType === 'happy';
}
