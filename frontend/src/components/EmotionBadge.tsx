import { EmotionType } from '../backend';

interface EmotionBadgeProps {
  emotion: EmotionType;
  size?: 'sm' | 'md';
}

const EMOTION_CONFIG: Record<string, { label: string; classes: string }> = {
  confess: {
    label: 'Confess',
    classes: 'bg-emotion-confess border-emotion-confess text-emotion-confess',
  },
  broke: {
    label: 'Broke',
    classes: 'bg-emotion-broke border-emotion-broke text-emotion-broke',
  },
  happy: {
    label: 'Happy',
    classes: 'bg-emotion-happy border-emotion-happy text-emotion-happy',
  },
};

export default function EmotionBadge({ emotion, size = 'sm' }: EmotionBadgeProps) {
  const config = EMOTION_CONFIG[emotion as string] || EMOTION_CONFIG.confess;
  return (
    <span
      className={`calm-badge border font-serif ${config.classes} ${
        size === 'md' ? 'text-sm px-4 py-1.5' : 'text-xs'
      }`}
    >
      {config.label}
    </span>
  );
}
