-- ============================================
-- ISTA AIT MELLOUL — EXAMPLE DATA
-- Run after full-reset.sql
-- ============================================

-- --------------------------------------------
-- 1. BREAKING NEWS
-- --------------------------------------------

insert into public.breaking_news (title, slug, level, status, expires_at)
values
  (
    'تعليق الدراسة صباح الاثنين بسبب أحوال الطقس',
    'weather-closure-monday',
    'dangerous',
    'published',
    now() + interval '2 days'
  ),
  (
    'آخر أجل لإيداع ملفات التدريب نهاية هذا الأسبوع',
    'internship-deadline-weekend',
    'urgent',
    'published',
    now() + interval '5 days'
  ),
  (
    'تحديث مواقيت استقبال المتدربين بمصلحة الإدارة',
    'admin-office-hours-update',
    'warning',
    'published',
    now() + interval '10 days'
  )
on conflict (slug) do nothing;

-- --------------------------------------------
-- 2. CATEGORIES
-- --------------------------------------------

insert into public.announcement_categories (name, slug)
values
  ('مستجدات إدارية', 'administrative-updates'),
  ('مباريات وتكوينات', 'training-and-competitions'),
  ('أنشطة المؤسسة', 'institution-activities')
on conflict (slug) do nothing;

insert into public.event_categories (name, slug)
values
  ('ورشات', 'workshops'),
  ('ندوات', 'seminars'),
  ('أنشطة طلابية', 'student-activities')
on conflict (slug) do nothing;

-- --------------------------------------------
-- 3. ANNOUNCEMENTS
-- --------------------------------------------

insert into public.announcements (
  title,
  slug,
  description,
  division_id,
  group_id,
  status,
  published_at,
  expires_at
)
select
  'إعلان عن انطلاق التسجيل في ورشات الدعم الرقمي',
  'digital-support-workshops-registration',
  'تعلن إدارة المؤسسة عن فتح باب التسجيل في ورشات الدعم الرقمي لفائدة المتدربين. تشمل الورشات أساسيات التصميم، إدارة المحتوى، والعمل التعاوني باستعمال الأدوات السحابية.',
  d.id,
  g.id,
  'published',
  now() - interval '2 days',
  now() + interval '20 days'
from public.divisions d
left join public.groups g on g.division_id = d.id and g.slug = 'dd101'
where d.slug = 'dev-digital'
on conflict (slug) do nothing;

insert into public.announcements (
  title,
  slug,
  description,
  division_id,
  group_id,
  status,
  published_at,
  expires_at
)
select
  'إعلان خاص بجدولة الامتحان التطبيقي النهائي',
  'final-practical-exam-schedule',
  'تمت برمجة الامتحان التطبيقي النهائي لفائدة جميع الشعب خلال الأسبوع المقبل. يرجى الاطلاع على توقيت الحضور والالتزام بالوثائق المطلوبة يوم الامتحان.',
  d.id,
  null,
  'published',
  now() - interval '1 day',
  now() + interval '15 days'
from public.divisions d
where d.slug = 'gestion'
on conflict (slug) do nothing;

insert into public.announcement_category_links (announcement_id, category_id)
select a.id, c.id
from public.announcements a
join public.announcement_categories c on c.slug = 'training-and-competitions'
where a.slug = 'digital-support-workshops-registration'
on conflict do nothing;

insert into public.announcement_category_links (announcement_id, category_id)
select a.id, c.id
from public.announcements a
join public.announcement_categories c on c.slug = 'administrative-updates'
where a.slug = 'final-practical-exam-schedule'
on conflict do nothing;

insert into public.announcement_files (
  announcement_id,
  file_url,
  file_name,
  file_type
)
select
  a.id,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'programme-ateliers.pdf',
  'pdf'
from public.announcements a
where a.slug = 'digital-support-workshops-registration'
on conflict do nothing;

insert into public.announcement_files (
  announcement_id,
  file_url,
  file_name,
  file_type
)
select
  a.id,
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  'exam-room-plan.jpg',
  'image'
from public.announcements a
where a.slug = 'final-practical-exam-schedule'
on conflict do nothing;

-- --------------------------------------------
-- 4. EVENTS
-- --------------------------------------------

insert into public.events (
  title,
  slug,
  description,
  cover_image,
  location,
  starts_at,
  ends_at,
  total_attendees,
  status
)
values
  (
    'ملتقى الابتكار الرقمي 2026',
    'digital-innovation-meetup-2026',
    'فعالية تجمع المتدربين والمؤطرين والمهنيين لمناقشة فرص الابتكار الرقمي، بناء المشاريع، وتطوير المهارات العملية داخل المؤسسة وخارجها.',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80',
    'قاعة الندوات الكبرى',
    now() + interval '7 days',
    now() + interval '7 days 4 hours',
    180,
    'published'
  ),
  (
    'ورشة تصميم واجهات الاستخدام',
    'ui-design-workshop',
    'ورشة تطبيقية موجهة للمتدربين المهتمين بتصميم واجهات الاستخدام وتجربة المستخدم مع أمثلة عملية وتمارين جماعية.',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
    'مختبر الإعلاميات 2',
    now() + interval '12 days',
    now() + interval '12 days 3 hours',
    60,
    'published'
  )
on conflict (slug) do nothing;

insert into public.event_category_links (event_id, category_id)
select e.id, c.id
from public.events e
join public.event_categories c on c.slug = 'seminars'
where e.slug = 'digital-innovation-meetup-2026'
on conflict do nothing;

insert into public.event_category_links (event_id, category_id)
select e.id, c.id
from public.events e
join public.event_categories c on c.slug = 'workshops'
where e.slug = 'ui-design-workshop'
on conflict do nothing;

insert into public.event_people (event_id, name, role, type)
select e.id, person_name, person_role, person_type
from public.events e
cross join (
  values
    ('سلمى أمين', 'منسقة الفعالية', 'organizer'),
    ('ياسين المرابط', 'خبير التحول الرقمي', 'participant'),
    ('هاجر السعدي', 'مؤطرة الورشات', 'participant')
) as people(person_name, person_role, person_type)
where e.slug = 'digital-innovation-meetup-2026';

insert into public.event_people (event_id, name, role, type)
select e.id, person_name, person_role, person_type
from public.events e
cross join (
  values
    ('أمين بلكبير', 'منشط الورشة', 'organizer'),
    ('ليلى حفيظ', 'مصممة واجهات', 'participant')
) as people(person_name, person_role, person_type)
where e.slug = 'ui-design-workshop';

insert into public.event_photos (event_id, photo_url)
select e.id, photo_url
from public.events e
cross join (
  values
    ('https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1400&q=80'),
    ('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80'),
    ('https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80')
) as photos(photo_url)
where e.slug = 'digital-innovation-meetup-2026';

insert into public.event_photos (event_id, photo_url)
select e.id, photo_url
from public.events e
cross join (
  values
    ('https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80'),
    ('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80')
) as photos(photo_url)
where e.slug = 'ui-design-workshop';
