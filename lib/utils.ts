type DateLike = string | number | Date | null | undefined;

export const IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Crect width='12' height='8' fill='%23e9efec'/%3E%3C/svg%3E";

function toDate(value: DateLike) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatDate(
  value: DateLike,
  locale = 'ar-MA',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
) {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function isExpired(value: DateLike, referenceDate: DateLike = new Date()) {
  const target = toDate(value);
  const reference = toDate(referenceDate);

  if (!target || !reference) return false;

  return target.getTime() < reference.getTime();
}
