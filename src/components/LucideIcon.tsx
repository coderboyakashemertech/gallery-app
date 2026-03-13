import type { ComponentProps } from 'react';
import type { Icon as LucideIconType } from 'lucide-react-native';
import React from 'react';

type Props = {
  icon: LucideIconType;
  color: string;
  size: number;
};

export function LucideIcon({ icon: Icon, color, size }: Props) {
  return <Icon color={color} size={size} strokeWidth={2.2} />;
}

export type PaperIconSource = (props: ComponentProps<typeof LucideIcon>) => JSX.Element;
