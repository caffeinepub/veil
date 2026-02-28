import { EmotionType } from '../backend';

interface EmotionBadgeProps {
  emotion: EmotionType;
}

const emotionConfig: Record<EmotionType, { label: string; className: string }> = {
  [EmotionType.confess]: {
    label: 'Confess',
    className: 'bg-emotion-confess/10 text-emotion-confess border-emotion-confess/30',
  },
  [EmotionType.broke]: {
    label: 'Broke',
    className: 'bg-emotion-broke/10 text-emotion-broke border-emotion-broke/30',
  },
  [EmotionType.happy]: {
    label: 'Happy',
    className: 'bg-emotion-happy/10 text-emotion-happy border-emotion-happy/30',
  },
};

export default function EmotionBadge({ emotion }: EmotionBadgeProps) {
  const config = emotionConfig[emotion] ?? emotionConfig[EmotionType.confess];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
