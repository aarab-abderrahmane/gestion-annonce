import type {
  ContentStatus,
  DangerNewsIconName,
  DangerNewsItem,
  DangerNewsTickerSettings,
} from '@/types';

export type DangerNewsItemRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  expires_at: string;
  deleted_at?: string | null;
};

export type DangerNewsTickerSettingsRow = {
  id: string;
  is_enabled: boolean;
  badge_label: string;
  title: string;
  speed_seconds: number;
  max_items: number;
  separator: string;
  icon_name: DangerNewsIconName;
  gradient_from_color: string;
  gradient_to_color: string;
  accent_color: string;
  text_color: string;
  created_at: string;
  updated_at: string;
};

export const DANGER_NEWS_ICON_VALUES = [
  'alert-triangle',
  'shield-alert',
  'bell-ring',
  'siren',
  'megaphone',
] as const satisfies readonly DangerNewsIconName[];

export const DANGER_NEWS_ICON_LABELS: Record<DangerNewsIconName, string> = {
  'alert-triangle': 'تحذير',
  'shield-alert': 'درع',
  'bell-ring': 'جرس',
  'siren': 'صافرة',
  'megaphone': 'مكبر',
};

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6})$/;

export const DEFAULT_DANGER_NEWS_TICKER_SETTINGS: DangerNewsTickerSettings = {
  isEnabled: true,
  badgeLabel: 'تنبيه خطير',
  title: 'الشريط الخطير',
  speedSeconds: 28,
  maxItems: 5,
  separator: '•',
  iconName: 'alert-triangle',
  gradientFromColor: '#FFE4E1',
  gradientToColor: '#FFF5F2',
  accentColor: '#C62828',
  textColor: '#5F2120',
};

function normalizeHexColor(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && HEX_COLOR_PATTERN.test(trimmed) ? trimmed.toUpperCase() : fallback;
}

export function normalizeDangerNewsItem(row: DangerNewsItemRow): DangerNewsItem {
  return {
    id: row.id,
    title: row.title,
    status: row.status as ContentStatus,
    expiryDate: row.expires_at,
    createdAt: row.created_at,
    deletedAt: row.deleted_at ?? null,
  };
}

export function normalizeDangerNewsTickerSettings(
  row?: Partial<DangerNewsTickerSettingsRow> | null,
): DangerNewsTickerSettings {
  return {
    id: row?.id,
    isEnabled: row?.is_enabled ?? DEFAULT_DANGER_NEWS_TICKER_SETTINGS.isEnabled,
    badgeLabel: row?.badge_label?.trim() || DEFAULT_DANGER_NEWS_TICKER_SETTINGS.badgeLabel,
    title: row?.title?.trim() || DEFAULT_DANGER_NEWS_TICKER_SETTINGS.title,
    speedSeconds: row?.speed_seconds ?? DEFAULT_DANGER_NEWS_TICKER_SETTINGS.speedSeconds,
    maxItems: row?.max_items ?? DEFAULT_DANGER_NEWS_TICKER_SETTINGS.maxItems,
    separator: row?.separator?.trim() || DEFAULT_DANGER_NEWS_TICKER_SETTINGS.separator,
    iconName: DANGER_NEWS_ICON_VALUES.includes(row?.icon_name as DangerNewsIconName)
      ? (row?.icon_name as DangerNewsIconName)
      : DEFAULT_DANGER_NEWS_TICKER_SETTINGS.iconName,
    gradientFromColor: normalizeHexColor(
      row?.gradient_from_color,
      DEFAULT_DANGER_NEWS_TICKER_SETTINGS.gradientFromColor,
    ),
    gradientToColor: normalizeHexColor(
      row?.gradient_to_color,
      DEFAULT_DANGER_NEWS_TICKER_SETTINGS.gradientToColor,
    ),
    accentColor: normalizeHexColor(
      row?.accent_color,
      DEFAULT_DANGER_NEWS_TICKER_SETTINGS.accentColor,
    ),
    textColor: normalizeHexColor(
      row?.text_color,
      DEFAULT_DANGER_NEWS_TICKER_SETTINGS.textColor,
    ),
    createdAt: row?.created_at,
    updatedAt: row?.updated_at,
  };
}
