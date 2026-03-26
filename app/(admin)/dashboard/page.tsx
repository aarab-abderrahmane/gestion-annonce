import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  Building2,
  CalendarDays,
  Newspaper,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import QuickControlsSection, { type QuickActionItem } from '@/components/admin/QuickControlsSection';
import StatsCard from '@/components/admin/StatsCard';
import { requireDashboardAccess } from '@/lib/admin-access';
import { createClient } from '@/lib/supabase/server';

type DashboardQuickAction = QuickActionItem & {
  isContentModule: boolean;
};

export default async function DashboardPage() {
  const access = await requireDashboardAccess();

  if (!access.isFullAdmin) {
    redirect(access.firstAccessiblePath ?? '/dashboard/events');
  }

  const supabase = await createClient();

  const [
    breakingCount,
    dangerNewsCount,
    announcementsCount,
    eventsCount,
    divisionsCount,
    dangerTickerRes,
    announcementsRes,
    eventsRes,
  ] = await Promise.all([
    supabase.from('breaking_news').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase
      .from('danger_news')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase.from('announcements').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('events').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('divisions').select('*', { count: 'exact', head: true }),
    supabase
      .from('danger_news_settings')
      .select('is_enabled, speed_seconds, max_items')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('announcements')
      .select('id, title, slug, published_at, status')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(5),
    supabase
      .from('events')
      .select('id, title, slug, starts_at, status, location')
      .is('deleted_at', null)
      .order('starts_at', { ascending: false })
      .limit(5),
  ]);

  const stats = [
    {
      label: 'الأخبار العاجلة',
      value: breakingCount.count ?? 0,
      accent: 'var(--md-error-container)',
      icon: <BellRing size={22} style={{ color: 'var(--md-on-error-container)' }} />,
      hint: 'تنبيهات عاجلة ومحتوى فوري',
      trend: 'متابعة لحظية',
    },
    {
      label: 'عناصر الشريط الخطير',
      value: dangerNewsCount.count ?? 0,
      accent: 'color-mix(in srgb, var(--md-error-container) 82%, white 18%)',
      icon: <AlertTriangle size={22} style={{ color: 'var(--md-on-error-container)' }} />,
      hint: 'عناصر مستقلة عن الأخبار العاجلة',
      trend: dangerTickerRes.data?.is_enabled ? 'الشريط مفعّل' : 'الشريط متوقف',
    },
    {
      label: 'الإعلانات',
      value: announcementsCount.count ?? 0,
      accent: 'var(--md-primary-container)',
      icon: <Newspaper size={22} style={{ color: 'var(--md-on-primary-container)' }} />,
      hint: 'المنشور والمحفوظ كمسودة',
      trend: 'النشر المؤسسي',
    },
    {
      label: 'الفعاليات',
      value: eventsCount.count ?? 0,
      accent: 'var(--md-tertiary-container)',
      icon: <CalendarDays size={22} style={{ color: 'var(--md-on-tertiary-container)' }} />,
      hint: 'الفعاليات القادمة والمستمرة',
      trend: 'برمجة زمنية',
    },
    {
      label: 'الأقسام',
      value: divisionsCount.count ?? 0,
      accent: 'var(--md-secondary-container)',
      icon: <Building2 size={22} style={{ color: 'var(--md-on-secondary-container)' }} />,
      hint: 'هيكلة المحتوى والوحدات',
      trend: 'تنظيم داخلي',
    },
  ];

  const quickActions = [
    {
      href: '/dashboard/breaking-news',
      label: 'الأخبار العاجلة',
      description: 'أنشئ إشعارًا سريعًا أو راجع التنبيهات النشطة.',
      icon: 'bell',
      accent: 'var(--md-error-container)',
      tone: 'var(--md-on-error-container)',
      isContentModule: true,
    },
    {
      href: '/dashboard/danger-news',
      label: 'الشريط الخطير',
      description: 'أدر عناصر الشريط الخطير واضبط سرعته والعناصر الظاهرة فيه.',
      icon: 'alert',
      accent: 'color-mix(in srgb, var(--md-error-container) 82%, white 18%)',
      tone: 'var(--md-on-error-container)',
      isContentModule: true,
    },
    {
      href: '/dashboard/announcements',
      label: 'الإعلانات',
      description: 'تابع المسودات والمنشورات والمهملات من مكان واحد.',
      icon: 'newspaper',
      accent: 'var(--md-primary-container)',
      tone: 'var(--md-on-primary-container)',
      isContentModule: true,
    },
    {
      href: '/dashboard/events',
      label: 'الفعاليات',
      description: 'أدِر الجدولة والصور والموقع وحالة النشر.',
      icon: 'calendar',
      accent: 'var(--md-tertiary-container)',
      tone: 'var(--md-on-tertiary-container)',
      isContentModule: true,
    },
    {
      href: '/dashboard/home-carousel',
      label: 'كاروسيل الرئيسية',
      description: 'خصص الشرائح البارزة المعروضة في الصفحة الأولى.',
      icon: 'images',
      accent: 'var(--md-secondary-container)',
      tone: 'var(--md-on-secondary-container)',
      isContentModule: true,
    },
    {
      href: '/dashboard/trash',
      label: 'سلة المهملات',
      description: 'استعرض كل العناصر المحذوفة ونفذ الاسترجاع أو الحذف النهائي جماعيا.',
      icon: 'trash',
      accent: 'color-mix(in srgb, var(--md-error-container) 72%, white 28%)',
      tone: 'var(--md-on-error-container)',
      isContentModule: true,
    },
    {
      href: '/dashboard/structure',
      label: 'الأقسام والمجموعات',
      description: 'اضبط بنية العرض والتصنيف داخل المنصة.',
      icon: 'folder',
      accent: 'var(--md-surface-container-highest)',
      tone: 'var(--md-on-surface)',
      isContentModule: false,
    },
    {
      href: '/dashboard/accounts',
      label: 'الحسابات المفوضة',
      description: 'راجع الصلاحيات والحسابات الإدارية المساندة.',
      icon: 'users',
      accent: 'var(--md-surface-container-highest)',
      tone: 'var(--md-on-surface)',
      isContentModule: false,
    },
  ] satisfies DashboardQuickAction[];
  const contentModuleCount = quickActions.filter((item) => item.isContentModule).length;

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 2xl:max-w-[1520px]">
      <section
        className="relative overflow-hidden rounded-[calc(var(--md-shape-xl)+6px)] border p-6 sm:p-7"
        style={{
          borderColor: 'color-mix(in srgb, var(--md-primary) 18%, var(--md-outline-variant) 82%)',
          background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--md-primary-container) 75%, white 25%) 0%, transparent 34%), radial-gradient(circle at bottom left, color-mix(in srgb, var(--md-tertiary-container) 72%, white 28%) 0%, transparent 28%), linear-gradient(135deg, var(--md-surface-container-low) 0%, var(--md-surface) 100%)',
        }}
      >
        <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full opacity-40" style={{ background: 'var(--md-secondary-container)' }} />
        <div className="absolute -right-8 top-0 h-24 w-24 rounded-full opacity-50" style={{ background: 'var(--md-primary-container)' }} />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
          <div className="space-y-5">
            <div
              className="inline-flex items-center gap-2 rounded-[var(--md-shape-full)] px-3 py-1.5 md-label-medium"
              style={{
                background: 'color-mix(in srgb, var(--md-primary-container) 78%, white 22%)',
                color: 'var(--md-on-primary-container)',
              }}
            >
              <Sparkles size={16} />
              مركز التحكم الإداري
            </div>

            <div className="space-y-3">
              <h2 className="md-display-small max-w-3xl leading-tight" style={{ color: 'var(--md-on-surface)' }}>
                نظرة تشغيلية سريعة على المحتوى والنشر والصلاحيات داخل المنصة.
              </h2>
              <p className="md-body-large max-w-2xl" style={{ color: 'var(--md-on-surface-variant)' }}>
                هذه الواجهة تعطيك صورة واضحة عن المحتوى الجاري، الوصول السريع إلى الوحدات الأساسية، وآخر العناصر التي تحتاج متابعة داخل لوحة الإدارة.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/announcements/create" className="md-btn md-btn-filled md-state">
                إعلان جديد
              </Link>
              <Link href="/dashboard/events/create" className="md-btn md-btn-tonal md-state">
                فعالية جديدة
              </Link>
              <Link href="/dashboard/breaking-news/create" className="md-btn md-btn-outlined md-state">
                خبر عاجل جديد
              </Link>
              <Link href="/dashboard/danger-news" className="md-btn md-btn-outlined md-state">
                تخصيص الشريط الخطير
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div
              className="rounded-[var(--md-shape-xl)] border p-5"
              style={{
                borderColor: 'var(--md-outline-variant)',
                background: 'color-mix(in srgb, var(--md-surface-container-high) 84%, white 16%)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--md-shape-l)]" style={{ background: 'var(--md-primary-container)' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--md-on-primary-container)' }} />
                </div>
                <div className="space-y-1">
                  <p className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>
                    حالة الوصول
                  </p>
                  <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                    أنت داخل مساحة الإدارة الكاملة مع جميع الوحدات التشغيلية.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-[var(--md-shape-xl)] border p-5"
              style={{
                borderColor: 'var(--md-outline-variant)',
                background: 'color-mix(in srgb, var(--md-surface-container-high) 84%, white 16%)',
              }}
            >
              <p className="md-label-large" style={{ color: 'var(--md-on-surface-variant)' }}>
                إيقاع العمل الحالي
              </p>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-[var(--md-shape-l)] px-4 py-3" style={{ background: 'var(--md-surface-container)' }}>
                  <span className="md-body-medium" style={{ color: 'var(--md-on-surface)' }}>وحدات المحتوى النشطة</span>
                  <span className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>{contentModuleCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-[var(--md-shape-l)] px-4 py-3" style={{ background: 'var(--md-surface-container)' }}>
                  <span className="md-body-medium" style={{ color: 'var(--md-on-surface)' }}>المسارات السريعة</span>
                  <span className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>{quickActions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <StatsCard
            key={item.label}
            label={item.label}
            value={item.value}
            accent={item.accent}
            icon={item.icon}
            hint={item.hint}
            trend={item.trend}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <QuickControlsSection
          items={quickActions.map(({ isContentModule: _isContentModule, ...item }) => item)}
        />

        <section className="space-y-4">
          <div className="md-card-outlined p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--md-shape-l)]" style={{ background: 'var(--md-secondary-container)' }}>
                <Settings size={20} style={{ color: 'var(--md-on-secondary-container)' }} />
              </div>
              <div className="space-y-1">
                <h2 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
                  ضبط النظام
                </h2>
                <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                  راجع إعدادات المنصة العامة، إدارة الحسابات، وسير العمل التشغيلي.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Link href="/dashboard/accounts" className="flex items-center justify-between rounded-[var(--md-shape-l)] px-4 py-3 md-state" style={{ background: 'var(--md-surface-container-low)' }}>
                <span className="md-body-medium" style={{ color: 'var(--md-on-surface)' }}>الحسابات المفوضة</span>
                <ArrowUpRight size={18} style={{ color: 'var(--md-on-surface-variant)' }} />
              </Link>
              <Link href="/dashboard/danger-news" className="flex items-center justify-between rounded-[var(--md-shape-l)] px-4 py-3 md-state" style={{ background: 'var(--md-surface-container-low)' }}>
                <span className="md-body-medium" style={{ color: 'var(--md-on-surface)' }}>
                  الشريط الخطير
                  <span className="mr-2 text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                    {dangerTickerRes.data?.is_enabled ? `مفعّل • ${dangerTickerRes.data.max_items} عناصر • ${dangerTickerRes.data.speed_seconds}s` : 'متوقف'}
                  </span>
                </span>
                <ArrowUpRight size={18} style={{ color: 'var(--md-on-surface-variant)' }} />
              </Link>
              <Link href="/dashboard/structure" className="flex items-center justify-between rounded-[var(--md-shape-l)] px-4 py-3 md-state" style={{ background: 'var(--md-surface-container-low)' }}>
                <span className="md-body-medium" style={{ color: 'var(--md-on-surface)' }}>الهيكلة والتصنيفات</span>
                <ArrowUpRight size={18} style={{ color: 'var(--md-on-surface-variant)' }} />
              </Link>
            </div>
          </div>

          <div className="md-card-outlined p-5" style={{ background: 'linear-gradient(180deg, var(--md-surface-container-low) 0%, var(--md-surface) 100%)' }}>
            <p className="md-label-large" style={{ color: 'var(--md-on-surface-variant)' }}>
              لمحة تنظيمية
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="md-body-medium" style={{ color: 'var(--md-on-surface)' }}>إجمالي المحتوى</span>
                <span className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>
                  {(breakingCount.count ?? 0) + (dangerNewsCount.count ?? 0) + (announcementsCount.count ?? 0) + (eventsCount.count ?? 0)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--md-surface-container-highest)' }}>
                <div className="h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(90deg, var(--md-primary) 0%, var(--md-tertiary) 100%)' }} />
              </div>
              <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)' }}>
                اللوحة جاهزة لإدارة الأخبار والإعلانات والفعاليات والواجهة الرئيسية من نفس المسار الإداري.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DataTable
          title="آخر الإعلانات"
          description="راجع آخر الإعلانات المضافة أو المعدلة قبل الانتقال إلى الإدارة الكاملة."
          rows={announcementsRes.data ?? []}
          emptyMessage="لا توجد إعلانات بعد."
          actionHref="/dashboard/announcements"
          actionLabel="عرض الكل"
          columns={[
            {
              key: 'title',
              header: 'العنوان',
              render: (row) => (
                <span className="md-body-medium font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                  {row.title}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => (
                <span
                  className="md-label-small rounded-[var(--md-shape-full)] px-3 py-1"
                  style={{
                    background: row.status === 'published' ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
                    color: row.status === 'published' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                  }}
                >
                  {row.status === 'published' ? 'منشور' : 'مسودة'}
                </span>
              ),
            },
            {
              key: 'published_at',
              header: 'تاريخ النشر',
              render: (row) =>
                row.published_at ? new Date(row.published_at).toLocaleDateString('ar-MA') : '—',
            },
          ]}
        />

        <DataTable
          title="آخر الفعاليات"
          description="عرض سريع لأقرب الفعاليات وجدولتها قبل تحريرها أو تحديثها."
          rows={eventsRes.data ?? []}
          emptyMessage="لا توجد فعاليات بعد."
          actionHref="/dashboard/events"
          actionLabel="عرض الكل"
          columns={[
            {
              key: 'title',
              header: 'العنوان',
              render: (row) => (
                <span className="md-body-medium font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                  {row.title}
                </span>
              ),
            },
            {
              key: 'location',
              header: 'الموقع',
              render: (row) => row.location || '—',
            },
            {
              key: 'starts_at',
              header: 'تاريخ البدء',
              render: (row) =>
                row.starts_at ? new Date(row.starts_at).toLocaleDateString('ar-MA') : '—',
            },
          ]}
        />
      </div>
    </div>
  );
}
