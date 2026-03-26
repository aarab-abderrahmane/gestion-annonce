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

insert into public.breaking_news (title, slug, level, status, expires_at)
values
  (
    'تحويل الدراسة الحضورية إلى نمط هجين لمدة يومين',
    'hybrid-classes-two-days',
    'dangerous',
    'published',
    now() + interval '3 days'
  ),
  (
    'فتح باب طلبات الاستفادة من المساعدة الاجتماعية',
    'social-aid-requests-open',
    'urgent',
    'published',
    now() + interval '8 days'
  ),
  (
    'تأجيل انطلاق التكوين المسائي إلى الساعة الخامسة',
    'evening-training-delayed-five-pm',
    'warning',
    'published',
    now() + interval '4 days'
  ),
  (
    'إشعار بخصوص صيانة شبكة الأنترنت داخل المؤسسة',
    'campus-network-maintenance-notice',
    'warning',
    'published',
    now() + interval '6 days'
  ),
  (
    'إلزامية إحضار بطاقة المتدرب خلال فترة الامتحانات',
    'student-card-required-exams',
    'urgent',
    'published',
    now() + interval '9 days'
  ),
  (
    'تعليق الولوج إلى المختبر 3 خلال أشغال التهيئة',
    'lab-3-closed-renovation',
    'dangerous',
    'published',
    now() + interval '7 days'
  ),
  (
    'تغيير استثنائي في نقطة تجمع النقل المدرسي',
    'transport-meeting-point-change',
    'warning',
    'published',
    now() + interval '5 days'
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

insert into public.announcement_categories (name, slug)
values
  ('الجدولة والامتحانات', 'schedules-and-exams'),
  ('المنح والدعم', 'grants-and-support'),
  ('المنصات الرقمية', 'digital-platforms'),
  ('شؤون المتدربين', 'student-affairs'),
  ('الموارد البيداغوجية', 'pedagogical-resources'),
  ('الإدماج والتدريب', 'internships-and-placement'),
  ('إشعارات داخلية', 'internal-notices')
on conflict (slug) do nothing;

insert into public.event_categories (name, slug)
values
  ('ورشات', 'workshops'),
  ('ندوات', 'seminars'),
  ('أنشطة طلابية', 'student-activities')
on conflict (slug) do nothing;

insert into public.event_categories (name, slug)
values
  ('أيام مفتوحة', 'open-days'),
  ('لقاءات مهنية', 'career-meetings'),
  ('تظاهرات رقمية', 'digital-events'),
  ('مسابقات', 'competitions'),
  ('معارض', 'exhibitions'),
  ('تأطير ومواكبة', 'mentoring'),
  ('جلسات تعريفية', 'orientation-sessions')
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
  seed.title,
  seed.slug,
  seed.description,
  d.id,
  g.id,
  'published',
  now() - seed.published_offset::interval,
  now() + seed.expires_offset::interval
from (
  values
    (
      'إعلان حول استعمال المنصة الرقمية الجديدة للغياب',
      'absence-platform-launch',
      'تعلن الإدارة عن اعتماد منصة رقمية جديدة لتتبع الغياب والتأخر. يرجى من جميع المتدربين تفعيل حساباتهم والاطلاع على دليل الاستعمال قبل نهاية الأسبوع.',
      'dev-digital',
      'dd101',
      'digital-platforms',
      '3 days',
      '30 days'
    ),
    (
      'برنامج حصص الدعم الخاصة بالاستعداد للامتحانات',
      'exam-prep-support-sessions',
      'ستنطلق حصص الدعم المكثف لفائدة المتدربين المقبلين على الامتحانات الإشهادية، وذلك وفق برمجة زمنية مسائية تمتد لأسبوعين.',
      'gestion',
      null,
      'schedules-and-exams',
      '4 days',
      '12 days'
    ),
    (
      'إعلان عن ورشة إعداد السيرة الذاتية والمقابلة المهنية',
      'cv-and-interview-workshop-announcement',
      'تنظم المؤسسة ورشة تكوينية حول إعداد السيرة الذاتية، تحسين الملف المهني، والاستعداد الجيد للمقابلات الفردية مع المشغلين.',
      'infra-digitale',
      null,
      'internships-and-placement',
      '6 days',
      '18 days'
    ),
    (
      'فتح باب التسجيل للاستفادة من فضاء المراجعة المسائي',
      'evening-study-space-registration',
      'تم تخصيص قاعات للمراجعة المسائية داخل المؤسسة خلال فترة الامتحانات، مع توفير تأطير إداري وتتبع للحضور بالنسبة للراغبين في الاستفادة.',
      'dev-digital',
      'dd101',
      'student-affairs',
      '2 days',
      '14 days'
    ),
    (
      'إعلان بخصوص تحيين ملفات المنحة والنقل',
      'grant-and-transport-files-update',
      'تدعو الإدارة المتدربين المعنيين إلى تحيين ملفات المنحة والنقل وإيداع الوثائق الناقصة داخل الآجال المحددة لتفادي رفض الطلبات.',
      'gestion',
      null,
      'grants-and-support',
      '5 days',
      '16 days'
    ),
    (
      'إشعار حول توزيع استعمال القاعات خلال الأسبوع المقبل',
      'classroom-allocation-next-week',
      'تم تحيين توزيع القاعات الزمنية لبعض الأفواج بسبب أشغال داخلية. المرجو مراجعة الجداول الجديدة قبل بداية الأسبوع المقبل.',
      'infra-digitale',
      null,
      'internal-notices',
      '1 day',
      '10 days'
    ),
    (
      'إطلاق سلسلة موارد بيداغوجية جديدة لفائدة المتدربين',
      'new-learning-resources-series',
      'أضيفت مجموعة جديدة من الموارد البيداغوجية الرقمية والملفات التطبيقية إلى فضاء المؤسسة الرقمي، مع تحديث الروابط الداخلية للوصول المباشر.',
      'dev-digital',
      'dd101',
      'pedagogical-resources',
      '7 days',
      '40 days'
    ),
    (
      'إعلان عن لقاء تواصلي مع أولياء المتدربين',
      'parents-communication-meeting',
      'تنظم المؤسسة لقاء تواصليا مع أولياء المتدربين لعرض مستجدات الموسم التكويني، مؤشرات الانضباط، وبرامج المواكبة والدعم.',
      'gestion',
      null,
      'institution-activities',
      '8 days',
      '9 days'
    )
) as seed(
  title,
  slug,
  description,
  division_slug,
  group_slug,
  category_slug,
  published_offset,
  expires_offset
)
join public.divisions d on d.slug = seed.division_slug
left join public.groups g on g.division_id = d.id and g.slug = seed.group_slug
on conflict (slug) do nothing;

insert into public.announcement_category_links (announcement_id, category_id)
select a.id, c.id
from (
  values
    ('absence-platform-launch', 'digital-platforms'),
    ('exam-prep-support-sessions', 'schedules-and-exams'),
    ('cv-and-interview-workshop-announcement', 'internships-and-placement'),
    ('evening-study-space-registration', 'student-affairs'),
    ('grant-and-transport-files-update', 'grants-and-support'),
    ('classroom-allocation-next-week', 'internal-notices'),
    ('new-learning-resources-series', 'pedagogical-resources'),
    ('parents-communication-meeting', 'institution-activities')
) as seed(slug, category_slug)
join public.announcements a on a.slug = seed.slug
join public.announcement_categories c on c.slug = seed.category_slug
on conflict do nothing;

insert into public.announcement_files (
  announcement_id,
  file_url,
  file_name,
  file_type
)
select
  a.id,
  seed.file_url,
  seed.file_name,
  seed.file_type
from (
  values
    (
      'absence-platform-launch',
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'guide-absence-platform.pdf',
      'pdf'
    ),
    (
      'cv-and-interview-workshop-announcement',
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
      'atelier-cv.jpg',
      'image'
    ),
    (
      'grant-and-transport-files-update',
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'grant-checklist.pdf',
      'pdf'
    )
) as seed(slug, file_url, file_name, file_type)
join public.announcements a on a.slug = seed.slug
where not exists (
  select 1
  from public.announcement_files af
  where af.announcement_id = a.id
    and af.file_name = seed.file_name
);

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
select
  seed.title,
  seed.slug,
  seed.description,
  seed.cover_image,
  seed.location,
  now() + seed.starts_in::interval,
  now() + seed.ends_in::interval,
  seed.total_attendees,
  'published'
from (
  values
    (
      'اليوم المفتوح للتوجيه والتخصصات',
      'orientation-open-day',
      'يوم مفتوح لفائدة المتدربين الجدد للتعرف على التخصصات المتاحة وآفاقها المهنية وبرامج المواكبة داخل المؤسسة.',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
      'البهو المركزي',
      '4 days',
      '4 days 5 hours',
      220
    ),
    (
      'مسابقة أفضل مشروع رقمي طلابي',
      'best-student-digital-project-competition',
      'مسابقة داخلية لعرض المشاريع الرقمية المنجزة من طرف المتدربين أمام لجنة تحكيم مكونة من مؤطرين ومهنيين.',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
      'قاعة العروض',
      '10 days',
      '10 days 6 hours',
      140
    ),
    (
      'لقاء مهني حول فرص الإدماج بعد التخرج',
      'career-opportunities-meeting',
      'لقاء تواصلي يجمع المتدربين مع مهنيين من سوق الشغل لعرض مسارات الإدماج، الانتظارات العملية، ومتطلبات التوظيف الأولى.',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80',
      'قاعة الاجتماعات',
      '15 days',
      '15 days 3 hours',
      90
    ),
    (
      'ورشة الأمن السيبراني للمبتدئين',
      'cybersecurity-workshop-beginners',
      'ورشة تطبيقية للتعرف على مبادئ الأمن السيبراني، حماية الحسابات، وأفضل الممارسات الأساسية للتعامل مع المخاطر الرقمية.',
      'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=1600&q=80',
      'مختبر الشبكات',
      '18 days',
      '18 days 4 hours',
      75
    ),
    (
      'معرض المشاريع التطبيقية لنهاية الدورة',
      'end-cycle-projects-exhibition',
      'معرض داخلي لعرض المشاريع التطبيقية التي أنجزها المتدربون طيلة الدورة أمام الإدارة والمهنيين والشركاء.',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
      'القاعة متعددة الاستعمالات',
      '21 days',
      '21 days 6 hours',
      160
    ),
    (
      'جلسة تعريفية بمنصة التدريب عن بعد',
      'remote-learning-platform-session',
      'جلسة تعريفية حول خصائص منصة التدريب عن بعد، طرق الولوج إلى الموارد، وآليات تسليم الأشغال الفردية والجماعية.',
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1600&q=80',
      'قاعة الإعلاميات 1',
      '6 days',
      '6 days 2 hours',
      85
    ),
    (
      'لقاء المواكبة النفسية والتحفيز الدراسي',
      'student-motivation-support-session',
      'لقاء تأطيري يركز على تدبير الضغط الدراسي، تطوير الدافعية، وتحسين التوازن بين التكوين والحياة اليومية للمتدرب.',
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
      'فضاء الأنشطة',
      '9 days',
      '9 days 2 hours',
      70
    ),
    (
      'ندوة التحول الرقمي في الخدمات العمومية',
      'digital-transformation-public-services',
      'ندوة علمية تناقش أثر التحول الرقمي على الخدمات العمومية، أدوار التكوين المهني، ومجالات التطوير المرتبطة بالمرفق العام.',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1600&q=80',
      'المدرج الرئيسي',
      '25 days',
      '25 days 4 hours',
      200
    )
) as seed(
  title,
  slug,
  description,
  cover_image,
  location,
  starts_in,
  ends_in,
  total_attendees
)
on conflict (slug) do nothing;

insert into public.event_category_links (event_id, category_id)
select e.id, c.id
from (
  values
    ('orientation-open-day', 'open-days'),
    ('best-student-digital-project-competition', 'competitions'),
    ('career-opportunities-meeting', 'career-meetings'),
    ('cybersecurity-workshop-beginners', 'workshops'),
    ('end-cycle-projects-exhibition', 'exhibitions'),
    ('remote-learning-platform-session', 'orientation-sessions'),
    ('student-motivation-support-session', 'mentoring'),
    ('digital-transformation-public-services', 'seminars')
) as seed(slug, category_slug)
join public.events e on e.slug = seed.slug
join public.event_categories c on c.slug = seed.category_slug
on conflict do nothing;

insert into public.event_people (event_id, name, role, type)
select e.id, seed.person_name, seed.person_role, seed.person_type
from (
  values
    ('orientation-open-day', 'أسماء حجي', 'منسقة اليوم المفتوح', 'organizer'),
    ('orientation-open-day', 'عبد الصمد أوطالب', 'مؤطر التوجيه', 'participant'),
    ('best-student-digital-project-competition', 'منى الإدريسي', 'رئيسة لجنة التحكيم', 'organizer'),
    ('best-student-digital-project-competition', 'يوسف بنصالح', 'عضو لجنة التحكيم', 'participant'),
    ('career-opportunities-meeting', 'فاطمة الزهراء العلمي', 'مكلفة بالشراكات', 'organizer'),
    ('career-opportunities-meeting', 'حمزة أيت موسى', 'ممثل مهني', 'participant'),
    ('cybersecurity-workshop-beginners', 'سعيد الراشدي', 'منشط الورشة', 'organizer'),
    ('cybersecurity-workshop-beginners', 'مريم باها', 'مؤطرة الأمن المعلوماتي', 'participant'),
    ('end-cycle-projects-exhibition', 'سمير بوعزة', 'منسق المعرض', 'organizer'),
    ('remote-learning-platform-session', 'نادية الخياري', 'مؤطرة المنصة', 'organizer'),
    ('student-motivation-support-session', 'حسن التومي', 'مؤطر المواكبة', 'organizer'),
    ('digital-transformation-public-services', 'ليلى السوسي', 'محاضرة رئيسية', 'participant')
) as seed(slug, person_name, person_role, person_type)
join public.events e on e.slug = seed.slug
where not exists (
  select 1
  from public.event_people ep
  where ep.event_id = e.id
    and ep.name = seed.person_name
    and ep.role = seed.person_role
);

insert into public.event_photos (event_id, photo_url)
select e.id, seed.photo_url
from (
  values
    ('orientation-open-day', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80'),
    ('best-student-digital-project-competition', 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1400&q=80'),
    ('career-opportunities-meeting', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1400&q=80'),
    ('cybersecurity-workshop-beginners', 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1400&q=80'),
    ('end-cycle-projects-exhibition', 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80'),
    ('remote-learning-platform-session', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80'),
    ('student-motivation-support-session', 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1400&q=80'),
    ('digital-transformation-public-services', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80')
) as seed(slug, photo_url)
join public.events e on e.slug = seed.slug
where not exists (
  select 1
  from public.event_photos ep
  where ep.event_id = e.id
    and ep.photo_url = seed.photo_url
);

-- --------------------------------------------
-- 5. DANGER NEWS
-- --------------------------------------------

insert into public.danger_news (title, status, expires_at)
select
  seed.title,
  'published',
  now() + seed.expires_in::interval
from (
  values
    ('تحديث استثنائي بخصوص ولوج البوابة الرئيسية صباحاً', '2 days'),
    ('التنقل داخل الورشات يخضع لمسار مؤقت بسبب أشغال الصيانة', '5 days'),
    ('إشعار بخصوص الانقطاع المؤقت للماء بالجهة الخلفية للمؤسسة', '1 day'),
    ('منع الوقوف بجانب مخارج الطوارئ طيلة هذا الأسبوع', '7 days'),
    ('التأكد من حمل الشارات التنظيمية خلال الفعاليات الكبرى', '6 days'),
    ('إغلاق مؤقت للمستودع التقني أمام المتدربين غير المعنيين', '8 days'),
    ('المرجو احترام الإشارات الجديدة داخل فضاء المختبرات', '10 days'),
    ('تم تغيير مسار الولوج إلى الإدارة بسبب التهيئة الداخلية', '3 days'),
    ('فتح استثنائي للبوابة الجانبية عند نهاية الحصص المسائية', '4 days'),
    ('إشعار تنظيمي حول توزيع الحراسة داخل الساحة الرئيسية', '9 days')
) as seed(title, expires_in)
where not exists (
  select 1
  from public.danger_news dn
  where dn.title = seed.title
);










-- 1. Create example auth users                                                                                                      
  with users_to_create as (                                                                                                            
    select *                                                                                                                           
    from (                                                                                                                             
      values                                                                                                                           
        ('abderrahmane@admin.com', 'Admin123!', 'Main Admin', true),                                                                        
        ('staff1@example.com', 'Staff123!', 'Staff One', false),                                                                       
        ('staff2@example.com', 'Staff123!', 'Staff Two', false),                                                                       
        ('staff3@example.com', 'Staff123!', 'Staff Three', false),                                                                     
        ('staff4@example.com', 'Staff123!', 'Staff Four', false)                                                                       
    ) as v(email, password, full_name, is_admin)                                                                                       
  ),                                                                                                                                   
  inserted_users as (                                                                                                                  
    insert into auth.users (                                                                                                           
      instance_id,                                                                                                                     
      id,                                                                                                                              
      aud,                                                                                                                             
      role,                                                                                                                            
      email,                                                                                                                           
      encrypted_password,                                                                                                              
      email_confirmed_at,                                                                                                              
      raw_app_meta_data,                                                                                                               
      raw_user_meta_data,                                                                                                              
      created_at,                                                                                                                      
      updated_at,                                                                                                                      
      confirmation_token,                                                                                                              
      email_change,                                                                                                                    
      email_change_token_new,                                                                                                          
      recovery_token                                                                                                                   
    )                                                                                                                                  
    select                                                                                                                             
      '00000000-0000-0000-0000-000000000000',                                                                                          
      gen_random_uuid(),                                                                                                               
      'authenticated',                                                                                                                 
      'authenticated',                                                                                                                 
      u.email,                                                                                                                         
      crypt(u.password, gen_salt('bf')),                                                                                               
      now(),                                                                                                                           
      case                                                                                                                             
        when u.is_admin then '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb                                        
        else '{"provider":"email","providers":["email"]}'::jsonb                                                                       
      end,                                                                                                                             
      jsonb_build_object('full_name', u.full_name),                                                                                    
      now(),                                                                                                                           
      now(),                                                                                                                           
      '',                                                                                                                              
      '',                                                                                                                              
      '',                                                                                                                              
      ''                                                                                                                               
    from users_to_create u                                                                                                             
    where not exists (                                                                                                                 
      select 1                                                                                                                         
      from auth.users au                                                                                                               
      where au.email = u.email                                                                                                         
    )                                                                                                                                  
    returning id, email, raw_app_meta_data                                                                                             
  ),                                                                                                                                   
  all_target_users as (                                                                                                                
    select id, email, raw_app_meta_data                                                                                                
    from auth.users                                                                                                                    
    where email in (                                                                                                                   
      'abderrahmane@admin.com',                                                                                                             
      'staff1@example.com',                                                                                                            
      'staff2@example.com',                                                                                                            
      'staff3@example.com',                                                                                                            
      'staff4@example.com'                                                                                                             
    )                                                                                                                                  
  )                                                                                                                                    
  insert into auth.identities (                                                                                                        
    id,                                                                                                                                
    user_id,                                                                                                                           
    identity_data,                                                                                                                     
    provider,                                                                                                                          
    provider_id,                                                                                                                       
    last_sign_in_at,                                                                                                                   
    created_at,                                                                                                                        
    updated_at                                                                                                                         
  )                                                                                                                                    
  select                                                                                                                               
    gen_random_uuid(),                                                                                                                 
    u.id,                                                                                                                              
    jsonb_build_object(                                                                                                                
      'sub', u.id::text,                                                                                                               
      'email', u.email                                                                                                                 
    ),                                                                                                                                 
    'email',                                                                                                                           
    u.id::text,                                                                                                                        
    now(),                                                                                                                             
    now(),                                                                                                                             
    now()                                                                                                                              
  from all_target_users u                                                                                                              
  where not exists (                                                                                                                   
    select 1                                                                                                                           
    from auth.identities i                                                                                                             
    where i.user_id = u.id                                                                                                             
      and i.provider = 'email'                                                                                                         
  );                                                                                                                                   
                                                                                                                                       
  -- 2. Create delegated dashboard accounts for the 4 staff users                                                                      
  with admin_user as (                                                                                                                 
    select id                                                                                                                          
    from auth.users                                                                                                                    
    where email = 'abderrahmane@admin.com'                                                                                                  
    limit 1                                                                                                                            
  ),                                                                                                                                   
  staff_users as (                                                                                                                     
    select                                                                                                                             
      id as user_id,                                                                                                                   
      email,                                                                                                                           
      coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)) as full_name                                             
    from auth.users                                                                                                                    
    where email in (                                                                                                                   
      'staff1@example.com',                                                                                                            
      'staff2@example.com',                                                                                                            
      'staff3@example.com',                                                                                                            
      'staff4@example.com'                                                                                                             
    )                                                                                                                                  
  ),                                                                                                                                   
  upsert_accounts as (                                                                                                                 
    insert into public.dashboard_accounts (                                                                                            
      user_id,                                                                                                                         
      full_name,                                                                                                                       
      email,                                                                                                                           
      status,                                                                                                                          
      created_by                                                                                                                       
    )                                                                                                                                  
    select                                                                                                                             
      s.user_id,                                                                                                                       
      s.full_name,                                                                                                                     
      s.email,                                                                                                                         
      'active',                                                                                                                        
      (select id from admin_user)                                                                                                      
    from staff_users s                                                                                                                 
    on conflict (user_id) do update                                                                                                    
    set                                                                                                                                
      full_name = excluded.full_name,                                                                                                  
      email = excluded.email,                                                                                                          
      status = excluded.status,                                                                                                        
      created_by = excluded.created_by,                                                                                                
      updated_at = now()                                                                                                               
    returning id, user_id                                                                                                              
  ),                                                                                                                                   
  target_accounts as (                                                                                                                 
    select da.id, da.user_id, da.email                                                                                                 
    from public.dashboard_accounts da                                                                                                  
    join staff_users s on s.user_id = da.user_id                                                                                       
  ),                                                                                                                                   
  deleted_permissions as (                                                                                                             
    delete from public.dashboard_account_permissions p                                                                                 
    using target_accounts ta                                                                                                           
    where p.account_id = ta.id                                                                                                         
  )
  insert into public.dashboard_account_permissions (                                                                                   
    account_id,                                                                                                                        
    resource,                                                                                                                          
    can_view,                                                                                                                          
    can_create,                                                                                                                        
    can_update,                                                                                                                        
    can_delete,                                                                                                                        
    can_publish                                                                                                                        
  )                                                                                                                                    
  select                                                                                                                               
    ta.id,
    r.resource,                                                                                                                        
    true,                                                                                                                              
    (random() < 0.6),                                                                                                                  
    (random() < 0.6),                                                                                                                  
    (random() < 0.4),                                                                                                                  
    (random() < 0.3)                                                                                                                   
  from target_accounts ta                                                                                                              
  cross join (                                                                                                                         
    values                                                                                                                             
      ('breaking_news'::text),                                                                                                         
      ('home_carousel'::text),                                                                                                         
      ('announcements'::text),                                                                                                         
      ('events'::text),                                                                                                                
      ('categories'::text),                                                                                                            
      ('structure'::text)                                                                                                              
  ) as r(resource);                                                                                                                    
                                                                                                                                       
  -- 3. Verify                                                                                                                         
  select                                                                                                                               
    da.full_name,                                                                                                                      
    da.email,                                                                                                                          
    da.status,                                                                                                                         
    dap.resource,                                                                                                                      
    dap.can_view,                                                                                                                      
    dap.can_create,                                                                                                                    
    dap.can_update,                                                                                                                    
    dap.can_delete,                                                                                                                    
    dap.can_publish                                                                                                                    
  from public.dashboard_accounts da                                                                                                    
  left join public.dashboard_account_permissions dap                                                                                   
    on dap.account_id = da.id                                                                                                          
  where da.email in (
    'staff1@example.com',                                                                                                              
    'staff2@example.com',                                                                                                              
    'staff3@example.com',                                                                                                              
    'staff4@example.com'                                                                                                               
  )                                                                                                                                    
  order by da.email, dap.resource;   
