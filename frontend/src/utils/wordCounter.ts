/**
 * Counts the number of words in a text string.
 * Splits by whitespace and filters empty strings.
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Returns true if the text meets the minimum word count requirement.
 */
export function meetsMinWordCount(text: string, minWords: number): boolean {
  return countWords(text) >= minWords;
}

export const MIN_WORDS_CONFESS_HAPPY = 24;
