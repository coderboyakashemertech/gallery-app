import type { ComponentType } from 'react';
import React from 'react';

type Props = {
  icon: ComponentType<{
    color?: string;
    size?: number;
    strokeWidth?: number;
  }>;
  color?: string;
  size: number;
};

export function LucideIcon({ icon: Icon, color, size }: Props) {
  return <Icon color={color} size={size} strokeWidth={2.2} />;
}
