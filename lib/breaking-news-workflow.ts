export const BREAKING_NEWS_EDITORIAL_STATUS_VALUES = [
  'draft',
  'in_review',
  'changes_requested',
  'approved',
] as const;

export type BreakingNewsEditorialStatus =
  (typeof BREAKING_NEWS_EDITORIAL_STATUS_VALUES)[number];

export const BREAKING_NEWS_EDITORIAL_STATUS_LABELS: Record<
  BreakingNewsEditorialStatus,
  string
> = {
  draft: 'مسودة',
  in_review: 'قيد المراجعة',
  changes_requested: 'مطلوب تعديلات',
  approved: 'تمت الموافقة',
};

export const BREAKING_NEWS_AUDIT_ACTION_VALUES = [
  'created',
  'updated',
  'submitted_for_review',
  'changes_requested',
  'approved',
  'published',
  'unpublished',
  'trashed',
  'restored',
  'purged',
] as const;

export type BreakingNewsAuditAction =
  (typeof BREAKING_NEWS_AUDIT_ACTION_VALUES)[number];

export const BREAKING_NEWS_AUDIT_ACTION_LABELS: Record<
  BreakingNewsAuditAction,
  string
> = {
  created: 'تم الإنشاء',
  updated: 'تم التعديل',
  submitted_for_review: 'تم الإرسال للمراجعة',
  changes_requested: 'تم طلب تعديلات',
  approved: 'تمت الموافقة',
  published: 'تم النشر',
  unpublished: 'تمت إعادة التحويل إلى مسودة',
  trashed: 'تم النقل إلى المهملات',
  restored: 'تمت الاستعادة',
  purged: 'تم الحذف النهائي',
};
