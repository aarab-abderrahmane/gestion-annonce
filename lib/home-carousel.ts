import type { ContentStatus, HomeCarouselSlide, HomeCarouselTarget } from '@/types';

type HomeCarouselSlideRow = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  target: string;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export const HOME_CAROUSEL_ROW_SELECT =
  'id, title, subtitle, image_url, cta_label, target, sort_order, status, created_at, updated_at';

export const HOME_CAROUSEL_ADMIN_ROW_SELECT = `${HOME_CAROUSEL_ROW_SELECT}, deleted_at`;

export type DefaultHomeCarouselSlideInput = {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  target: HomeCarouselTarget;
  sortOrder: number;
  status: ContentStatus;
};

export const DEFAULT_HOME_CAROUSEL_SLIDE_INPUTS: DefaultHomeCarouselSlideInput[] = [
  {
    title: 'مستقبل التحول الرقمي',
    subtitle: 'نحو آفاق جديدة من الابتكار والتميز المؤسسي',
    imageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600',
    ctaLabel: 'استكشف الفعاليات',
    target: 'events',
    sortOrder: 1,
    status: 'published',
  },
  {
    title: 'بيئة عمل ذكية',
    subtitle: 'إطلاق الحزمة الجديدة من الخدمات الإلكترونية للموظفين',
    imageUrl:
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600',
    ctaLabel: 'تصفح الإعلانات',
    target: 'announcements',
    sortOrder: 2,
    status: 'published',
  },
  {
    title: 'ملتقى الإبداع السنوي',
    subtitle: 'شاركنا أفكارك لتطوير مستقبل مؤسستنا نحو الأفضل',
    imageUrl:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1600',
    ctaLabel: 'سجل الآن',
    target: 'events',
    sortOrder: 3,
    status: 'published',
  },
];

export function normalizeHomeCarouselSlide(row: HomeCarouselSlideRow): HomeCarouselSlide {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    ctaLabel: row.cta_label,
    target: row.target as HomeCarouselTarget,
    sortOrder: row.sort_order,
    status: row.status as ContentStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
