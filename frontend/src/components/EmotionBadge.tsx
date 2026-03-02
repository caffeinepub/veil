import React from 'react';
import { EmotionType } from '../backend';

interface EmotionBadgeProps {
  emotionType: EmotionType | string;
}

const EMOTION_CONFIG: Record<string, { label: string; className: string }> = {
  [EmotionType.happy]: {
    label: '✦ Happy',
    className: 'bg-emotion-happy/15 text-emotion-happy border border-emotion-happy/30',
  },
  [EmotionType.confess]: {
    label: '◈ Confess',
    className: 'bg-emotion-confess/15 text-emotion-confess border border-emotion-confess/30',
  },
  [EmotionType.broke]: {
    label: '◌ Broke',
    className: 'bg-emotion-broke/15 text-emotion-broke border border-emotion-broke/30',
  },
};

export default function EmotionBadge({ emotionType }: EmotionBadgeProps) {
  const config = EMOTION_CONFIG[emotionType as string] ?? {
    label: String(emotionType),
    className: 'bg-muted text-muted-foreground border border-border',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
