import { Announcement, NewsAlert, Event, RiskLevel } from '@/types';

const slugify = (value: string) =>
  value
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const withSlug = <T extends { title: string }>(item: T) => ({ ...item, slug: slugify(item.title) });

const getDate = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

const getDateTime = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

const baseAnnouncements: Announcement[] = [
  withSlug({
    id: '1',
    title: 'تحديث سياسة العمل عن بعد',
    category: 'إداري',
    department: 'الموارد البشرية',
    publishDate: getDate(-2),
    expiryDate: getDate(30),
    content: 'نعلن عن تحديثات جديدة في سياسة العمل المرن والمزايا المتاحة للموظفين بما يتوافق مع استراتيجية المؤسسة الجديدة.',
    attachments: [
      { name: 'دليل السياسات المحدث 2024.pdf', url: '#' },
      { name: 'نموذج طلب العمل المرن.docx', url: '#' },
      { name: 'صورة توضيحية للمكاتب الجديدة.jpg', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200' },
    ],
  }),
  withSlug({
    id: '2',
    title: 'إطلاق مسابقة الابتكار السنوية',
    category: 'فعاليات',
    department: 'التطوير والابتكار',
    publishDate: getDate(-5),
    expiryDate: getDate(15),
    content: 'ندعو جميع المبدعين للمشاركة في مسابقة الابتكار السنوية بجوائز قيمة. التسجيل مفتوح لجميع الأقسام.',
    attachments: [
      { name: 'شروط المسابقة والمعايير.pdf', url: '#' },
      { name: 'بوستر المسابقة الرسمي.png', url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200' },
    ],
  }),
  withSlug({
    id: '3',
    title: 'صيانة أنظمة الشبكة الداخلية',
    category: 'تقني',
    department: 'تقنية المعلومات',
    publishDate: getDate(-1),
    expiryDate: getDate(2),
    content: 'سيتم إجراء صيانة دورية للخوادم يوم الجمعة القادم من الساعة 10 مساءً وحتى 2 صباحاً.',
  }),
];

const departments = ['الموارد البشرية', 'تقنية المعلومات', 'الشؤون القانونية', 'المالية', 'العلاقات العامة'];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  ...baseAnnouncements,
  ...Array.from({ length: 15 }).map((_, i) =>
    withSlug({
      id: `generated-${i}`,
      title: `إعلان إداري رقم ${i + 1}`,
      category: i % 3 === 0 ? 'إداري' : i % 3 === 1 ? 'تقني' : 'عام',
      department: departments[i % departments.length],
      publishDate: getDate(-10 - i),
      expiryDate: getDate(10),
      content: 'هذا نص تجريبي لإعلان يهدف إلى اختبار خاصية التنقل بين الصفحات في الموقع.',
    }),
  ),
];

const baseNews: NewsAlert[] = [
  withSlug({
    id: 'n1',
    title: 'تنبيه أمني عاجل',
    description: 'يرجى تغيير كلمات المرور الخاصة بالدخول الموحد قبل نهاية اليوم كإجراء احترازي نظراً لتحديثات أمنية.',
    riskLevel: 'high' as RiskLevel,
    publishDate: getDateTime(-1),
    expiryDate: getDateTime(2),
  }),
  withSlug({
    id: 'n2',
    title: 'تحديث بوابة الموظفين',
    description: 'ستتوفر ميزات جديدة في بوابة الموظفين بدءاً من الغد. قد تلاحظ بعض البطء أثناء التحديث.',
    riskLevel: 'medium' as RiskLevel,
    publishDate: getDateTime(-2),
    expiryDate: getDateTime(5),
  }),
  withSlug({
    id: 'n3',
    title: 'إجازة يوم التأسيس',
    description: 'نذكركم بأن يوم الأحد القادم عطلة رسمية.',
    riskLevel: 'low' as RiskLevel,
    publishDate: getDateTime(-30),
    expiryDate: getDateTime(-5),
  }),
  withSlug({
    id: 'n4',
    title: 'حالة الطقس',
    description: 'تحذير من أمطار غزيرة متوقعة غداً، يرجى أخذ الحيطة والحذر.',
    riskLevel: 'medium' as RiskLevel,
    publishDate: getDateTime(0),
    expiryDate: getDateTime(1),
  }),
];

export const MOCK_NEWS: NewsAlert[] = [
  ...baseNews,
  ...Array.from({ length: 12 }).map((_, i) =>
    withSlug({
      id: `news-gen-${i}`,
      title: `خبر إداري هام ${i + 1}`,
      description: 'تفاصيل الخبر الإداري تظهر هنا بشكل مختصر لاختبار العرض في القائمة.',
      riskLevel: (i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low') as RiskLevel,
      publishDate: getDateTime(-i),
      expiryDate: getDateTime(5),
    }),
  ),
];

const baseEvents: Event[] = [
  withSlug({
    id: 'e1',
    title: 'مؤتمر التحول الرقمي',
    date: getDate(45),
    endDate: getDate(47),
    location: 'مركز المؤتمرات الرئيسي',
    shortDescription: 'استعراض أحدث تقنيات الذكاء الاصطناعي والتحول الرقمي في المؤسسات.',
    isUpcoming: true,
    category: 'تقني',
    logo: 'https://picsum.photos/seed/event1/200/200',
    detailedDescription: 'يهدف هذا المؤتمر إلى جمع قادة الصناعة لمناقشة التحديات والفرص في عصر الرقمنة الشاملة. سيتضمن المؤتمر أكثر من 20 جلسة نقاشية وورش عمل تخصصية.',
    targetAudience: ['مدراء تقنية المعلومات', 'رواد الأعمال', 'المطورين'],
    activities: ['ورشة عمل الأمن السيبراني', 'منصة العرض التقني', 'جلسات التواصل'],
    program: [
      { time: '09:00 ص', activity: 'الافتتاح الرسمي' },
      { time: '10:30 ص', activity: 'كلمة الضيف الرئيسي' },
      { time: '01:00 م', activity: 'غداء عمل' },
    ],
    gallery: [
      'https://picsum.photos/seed/gallery1/800/400',
      'https://picsum.photos/seed/gallery2/800/400',
      'https://picsum.photos/seed/gallery3/800/400',
    ],
    speakers: [
      {
        id: 's1',
        name: 'د. أحمد الصالح',
        role: 'خبير ذكاء اصطناعي',
        bio: 'خبرة تزيد عن 20 عاماً في تطوير النظم الذكية.',
        image: 'https://picsum.photos/seed/s1/100/100',
      },
    ],
    results: ['توقيع 5 مذكرات تفاهم', 'حضور أكثر من 1000 زائر'],
    documents: [{ name: 'كتيب المؤتمر.pdf', url: '#' }],
  }),
  withSlug({
    id: 'e2',
    title: 'ورشة عمل التخطيط الاستراتيجي',
    date: getDate(10),
    location: 'قاعة الاجتماعات الكبرى',
    shortDescription: 'ورشة عمل مكثفة لمناقشة أهداف المؤسسة للربع السنوي القادم.',
    isUpcoming: true,
    category: 'إداري',
  }),
  withSlug({
    id: 'e3',
    title: 'منتدى القيادات الشابة',
    date: '2023-12-05',
    location: 'فندق الفيصلية',
    shortDescription: 'تجمع للشباب الطموح لمناقشة مهارات القيادة.',
    isUpcoming: false,
    category: 'تطوير',
  }),
];

export const MOCK_EVENTS: Event[] = [
  ...baseEvents,
  ...Array.from({ length: 18 }).map((_, i) =>
    withSlug({
      id: `past-event-${i}`,
      title: `فعالية سابقة ملتقى التميز ${i + 1}`,
      date: getDate(-30 - i * 5),
      location: 'المقر الرئيسي',
      shortDescription: 'فعالية تم عقدها سابقاً لمناقشة معايير الجودة والتميز المؤسسي.',
      isUpcoming: false,
      category: 'عام',
    }),
  ),
];

export const findAnnouncementBySlug = (slug: string) =>
  MOCK_ANNOUNCEMENTS.find((item) => item.slug === slug);

export const findEventBySlug = (slug: string) =>
  MOCK_EVENTS.find((item) => item.slug === slug);
