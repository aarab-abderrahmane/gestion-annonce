import { z } from 'zod';

const contentStatusSchema = z.enum(['draft', 'published']);
const nonEmptyString = z.string().trim().min(1, 'هذا الحقل مطلوب.');
const optionalDateString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'التاريخ غير صالح.');

export const breakingNewsSchema = z.object({
  title: nonEmptyString.max(200, 'العنوان طويل جداً.'),
  slug: z.string().trim().optional().or(z.literal('')),
  level: z.enum(['dangerous', 'urgent', 'warning']),
  status: contentStatusSchema,
  expires_at: nonEmptyString.refine((value) => !Number.isNaN(Date.parse(value)), 'تاريخ الانتهاء غير صالح.'),
});

export const homeCarouselTargetSchema = z.enum([
  'home',
  'announcements',
  'important-info',
  'events',
]);

export const homeCarouselSlideSchema = z.object({
  title: nonEmptyString.max(200, 'العنوان طويل جداً.'),
  subtitle: nonEmptyString.max(280, 'الوصف طويل جداً.'),
  image_url: z.string().trim().url('رابط الصورة غير صالح.').optional().or(z.literal('')),
  cta_label: nonEmptyString.max(80, 'نص الزر طويل جداً.'),
  target: homeCarouselTargetSchema,
  sort_order: z.coerce.number().int().min(1, 'الترتيب يجب أن يكون 1 أو أكثر.'),
  status: contentStatusSchema,
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email('البريد الإلكتروني غير صالح.'),
  password: nonEmptyString,
});

export const adminSettingsSchema = z.object({
  email: z.string().trim().email('البريد الإلكتروني غير صالح.').optional().or(z.literal('')),
  password: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || value.length >= 6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.'),
});

export const categoryFormSchema = z.object({
  name: nonEmptyString.max(100, 'اسم الصنف طويل جداً.'),
  slug: nonEmptyString.max(120, 'الرابط المختصر طويل جداً.'),
});

export const announcementFileSchema = z.object({
  id: z.string().optional(),
  file_url: z.string().url('رابط الملف غير صالح.'),
  file_name: z.string().nullable().optional(),
  file_type: z.enum(['pdf', 'image']).optional(),
});

export const announcementSchema = z.object({
  title: nonEmptyString.max(200, 'العنوان طويل جداً.'),
  slug: z.string().trim().optional().or(z.literal('')),
  description: nonEmptyString,
  division_id: nonEmptyString,
  group_id: z.string().trim().optional().or(z.literal('')),
  category_ids: z.array(z.string().trim().min(1)).default([]),
  expires_at: optionalDateString,
  status: contentStatusSchema,
  files: z.array(announcementFileSchema).optional().default([]),
});

export const eventPersonSchema = z
  .object({
    name: z.string().trim(),
    role: z.string().trim(),
    type: z.enum(['participant', 'organizer']),
  })
  .refine(
    (person) => (person.name.length === 0 && person.role.length === 0) || (person.name.length > 0 && person.role.length > 0),
    {
      message: 'يجب إدخال الاسم والدور معاً أو تركهما فارغين.',
      path: ['name'],
    },
  );

export const eventPhotoSchema = z.object({
  id: z.string().optional(),
  photo_url: z.string().url('رابط الصورة غير صالح.'),
});

export const eventSchema = z
  .object({
    title: nonEmptyString.max(200, 'العنوان طويل جداً.'),
    slug: z.string().trim().optional().or(z.literal('')),
    description: nonEmptyString,
    location: nonEmptyString,
    starts_at: nonEmptyString.refine((value) => !Number.isNaN(Date.parse(value)), 'تاريخ البداية غير صالح.'),
    ends_at: nonEmptyString.refine((value) => !Number.isNaN(Date.parse(value)), 'تاريخ النهاية غير صالح.'),
    total_attendees: z.number().int().min(0, 'عدد الحضور يجب أن يكون صفراً أو أكثر.'),
    status: contentStatusSchema,
    category_ids: z.array(z.string().trim().min(1)).default([]),
    people: z.array(eventPersonSchema).default([]),
    cover_image: z.string().trim().optional().or(z.literal('')),
    photos: z.array(eventPhotoSchema).optional().default([]),
  })
  .refine((value) => new Date(value.ends_at).getTime() >= new Date(value.starts_at).getTime(), {
    message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية.',
    path: ['ends_at'],
  });

export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const allowedImageExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  'avif',
]);

export type UploadFileType = 'pdf' | 'image';

function getFileExtension(name: string) {
  return name.includes('.') ? name.split('.').pop()?.toLowerCase() ?? '' : '';
}

export function getUploadFileType(file: {
  name: string;
  type?: string | null;
}): UploadFileType | null {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type?.startsWith('image/')) return 'image';

  const extension = getFileExtension(file.name);
  if (extension === 'pdf') return 'pdf';
  if (allowedImageExtensions.has(extension)) return 'image';

  return null;
}

export function validateUploadFile(file: {
  name: string;
  size: number;
  type?: string | null;
}) {
  const fileType = getUploadFileType(file);

  if (!fileType) {
    return {
      success: false as const,
      error: 'يُسمح فقط بملفات PDF والصور.',
    };
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return {
      success: false as const,
      error: 'يجب ألا يتجاوز حجم الملف 10 ميغابايت.',
    };
  }

  return {
    success: true as const,
    fileType,
  };
}

export function getFirstZodError(error: z.ZodError) {
  const flattened = error.flatten();

  return (
    flattened.formErrors[0] ??
    Object.values(flattened.fieldErrors)
      .flat()
      .find((message): message is string => Boolean(message)) ??
    'البيانات المدخلة غير صالحة.'
  );
}

export type BreakingNewsFormValues = z.infer<typeof breakingNewsSchema>;
export type HomeCarouselSlideFormValues = z.infer<typeof homeCarouselSlideSchema>;
export type AnnouncementFormValues = z.infer<typeof announcementSchema>;
export type EventFormValues = z.infer<typeof eventSchema>;
