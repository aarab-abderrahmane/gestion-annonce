"use client";

import {
  AlertTriangle,
  BellRing,
  Info,
  Megaphone,
  ShieldAlert,
  Siren,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import type { DangerNewsIconName } from '@/types';

const iconMap = {
  'alert-triangle': AlertTriangle,
  'shield-alert': ShieldAlert,
  'bell-ring': BellRing,
  'siren': Siren,
  'megaphone': Megaphone,
} satisfies Record<DangerNewsIconName, typeof AlertTriangle>;

export default function DangerNewsIcon({
  name,
  size = 20,
  style,
  className,
}: {
  name: DangerNewsIconName;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const Icon = iconMap[name] ?? Info;
  return <Icon size={size} style={style} className={className} />;
}
