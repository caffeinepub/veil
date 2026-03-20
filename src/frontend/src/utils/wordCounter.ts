import { EmotionType } from "../backend";

export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function needsMinimumWords(emotionType: EmotionType): boolean {
  return (
    emotionType === EmotionType.confess || emotionType === EmotionType.happy
  );
}

export function hasMinimumWords(
  text: string,
  emotionType: EmotionType,
): boolean {
  if (!needsMinimumWords(emotionType)) return true;
  return countWords(text) >= 24;
}
