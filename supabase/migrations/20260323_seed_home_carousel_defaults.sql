insert into public.home_carousel_slides (
  title,
  subtitle,
  image_url,
  cta_label,
  target,
  sort_order,
  status
)
select *
from (
  values
    (
      'مستقبل التحول الرقمي',
      'نحو آفاق جديدة من الابتكار والتميز المؤسسي',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600',
      'استكشف الفعاليات',
      'events',
      1,
      'published'
    ),
    (
      'بيئة عمل ذكية',
      'إطلاق الحزمة الجديدة من الخدمات الإلكترونية للموظفين',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600',
      'تصفح الإعلانات',
      'announcements',
      2,
      'published'
    ),
    (
      'ملتقى الإبداع السنوي',
      'شاركنا أفكارك لتطوير مستقبل مؤسستنا نحو الأفضل',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1600',
      'سجل الآن',
      'events',
      3,
      'published'
    )
) as default_slides (
  title,
  subtitle,
  image_url,
  cta_label,
  target,
  sort_order,
  status
)
where not exists (
  select 1
  from public.home_carousel_slides
);
