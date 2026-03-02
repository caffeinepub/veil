import { EmotionType } from '../backend';

interface EmotionBadgeProps {
  emotionType: EmotionType;
  className?: string;
}

const emotionConfig: Record<EmotionType, { label: string; className: string }> = {
  [EmotionType.happy]: {
    label: 'Happy',
    className: 'bg-[var(--emotion-happy-bg)] text-[var(--emotion-happy-text)]',
  },
  [EmotionType.confess]: {
    label: 'Confess',
    className: 'bg-[var(--emotion-confess-bg)] text-[var(--emotion-confess-text)]',
  },
  [EmotionType.broke]: {
    label: 'Broke',
    className: 'bg-[var(--emotion-broke-bg)] text-[var(--emotion-broke-text)]',
  },
};

export default function EmotionBadge({ emotionType, className = '' }: EmotionBadgeProps) {
  const config = emotionConfig[emotionType];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
