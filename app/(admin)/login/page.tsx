import { redirect } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Sparkles, Waypoints } from 'lucide-react';
import LoginForm from '@/components/admin/LoginForm';
import { getAdminAccess } from '@/lib/admin-access';

const highlights = [
  {
    icon: ShieldCheck,
    title: 'وصول محكوم بالصلاحيات',
    description: 'الدخول مرتبط بدور المدير أو الحسابات المفوضة مع صلاحيات دقيقة لكل قسم.',
  },
  {
    icon: Sparkles,
    title: 'واجهة إدارة موحدة',
    description: 'نفس لغة التصميم المعتمدة في المنصة العامة ولوحة التحكم، بدون شاشات منفصلة بصريا.',
  },
  {
    icon: Waypoints,
    title: 'تدبير سريع للمحتوى',
    description: 'الإعلانات، الأخبار العاجلة، الفعاليات، البنية، والأقسام كلها من نفس البوابة.',
  },
];

export default async function LoginPage() {
  const access = await getAdminAccess();

  if (access?.hasDashboardAccess) {
    redirect(access.isFullAdmin ? '/dashboard' : access.firstAccessiblePath ?? '/dashboard');
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at top right, rgba(158, 242, 228, 0.8), transparent 28%), radial-gradient(circle at bottom left, rgba(212, 227, 255, 0.8), transparent 24%), linear-gradient(180deg, var(--md-surface) 0%, #edf5f2 100%)',
        fontFamily: 'var(--md-font-brand)',
      }}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,106,96,0.05) 0%, transparent 35%, rgba(77,95,124,0.07) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto flex  min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div
          className="grid w-full overflow-hidden rounded-[36px] border lg:grid-cols-[1.1fr_0.9fr] "
          style={{
            background: 'rgba(255,255,255,0.78)',
            borderColor: 'rgba(111, 121, 119, 0.18)',
            boxShadow: '0 32px 80px rgba(18, 43, 39, 0.12)',
            backdropFilter: 'blur(18px)',
          }}
        
        >
          <section
            dir="rtl"
            className="relative overflow-hidden px-6 py-8 sm:px-8 lg:px-10 lg:py-10"
            style={{
              background:
                'linear-gradient(180deg, rgba(233,239,236,0.84) 0%, rgba(255,255,255,0.96) 100%)',
            }}
          >
            <div
              className="absolute left-8 top-8 h-32 w-32 rounded-full blur-3xl"
              style={{ background: 'rgba(0, 106, 96, 0.12)' }}
            />
            <div
              className="absolute bottom-10 right-6 h-28 w-28 rounded-full blur-3xl"
              style={{ background: 'rgba(77, 95, 124, 0.12)' }}
            />

            <div className="relative space-y-8">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: 'rgba(111, 121, 119, 0.18)',
                    color: 'var(--md-on-surface-variant)',
                  }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--md-primary)' }} />
                  بوابة الإدارة
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="site-logo-ring shrink-0"
                  style={{ boxShadow: '0 10px 30px rgba(0, 106, 96, 0.10)' }}
                >
                  <div
                    className="site-logo-ring__inner flex h-16 w-16 items-center justify-center overflow-hidden rounded-full"
                    style={{ background: 'var(--md-surface-container-lowest)' }}
                  >
                    <Image
                      src="/images/ofppt-logo.jpeg"
                      alt="شعار المعهد"
                      width={72}
                      height={72}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="md-label-large" style={{ color: 'var(--md-primary)' }}>
                    ISTA Ait Melloul
                  </p>
                  <h1 className="md-headline-medium leading-[1.45]" style={{ color: 'var(--md-on-surface)' }}>
                    الولوج إلى لوحة إدارة الإعلانات والفعاليات والمستجدات الرسمية
                  </h1>
                  <p className="md-body-large max-w-2xl leading-8" style={{ color: 'var(--md-on-surface-variant)' }}>
                    شاشة دخول واحدة بنفس هوية المنصة الأساسية، مع تركيز على الوضوح، الصلاحيات، وسرعة الوصول إلى أدوات التسيير.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {highlights.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="rounded-[28px] border px-5 py-5"
                    style={{
                      background: 'rgba(255,255,255,0.78)',
                      borderColor: 'rgba(111, 121, 119, 0.16)',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                          background: 'var(--md-primary-container)',
                          color: 'var(--md-on-primary-container)',
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="space-y-1.5">
                        <h2 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
                          {title}
                        </h2>
                        <p className="md-body-medium leading-7" style={{ color: 'var(--md-on-surface-variant)' }}>
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="rounded-[28px] border px-5 py-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,106,96,0.08), rgba(77,95,124,0.08))',
                  borderColor: 'rgba(0, 106, 96, 0.14)',
                }}
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--md-primary)' }} />
                  <div className="space-y-2">
                    <h2 className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>
                      تذكير أمني
                    </h2>
                    <p className="md-body-medium leading-7" style={{ color: 'var(--md-on-surface-variant)' }}>
                      الولوج مخصص للأطر المخول لها فقط. إذا تم إنشاء حساب مفوض، فستظهر له الصفحات المرتبطة بصلاحياته دون غيرها.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            dir="rtl"
            className="flex items-center border-t px-6 py-8 sm:px-8 lg:border-r lg:border-t-0 lg:px-10 lg:py-10"
            style={{ borderColor: 'var(--md-outline-variant)' }}
          >
            <div className="mx-auto w-full max-w-xl space-y-6">
              <div className="space-y-3">
                <p className="md-label-large" style={{ color: 'var(--md-primary)' }}>
                  تسجيل الدخول
                </p>
                <h2 className="md-headline-small" style={{ color: 'var(--md-on-surface)' }}>
                  مرحبا بك في مساحة الإدارة
                </h2>
                <p className="md-body-large leading-8" style={{ color: 'var(--md-on-surface-variant)' }}>
                  أدخل البريد الإلكتروني وكلمة المرور للانتقال مباشرة إلى لوحة التحكم أو إلى أول قسم متاح حسب الصلاحيات.
                </p>
              </div>

              <div
                className="rounded-[32px] border p-5 sm:p-6"
                style={{
                  background: 'var(--md-surface-container-low)',
                  borderColor: 'rgba(111, 121, 119, 0.16)',
                  boxShadow: '0 16px 40px rgba(25, 28, 28, 0.06)',
                }}
              >
                <LoginForm />
              </div>

              <p className="text-center text-[13px] leading-6" style={{ color: 'var(--md-outline)' }}>
                جميع محاولات الولوج إلى المنصة الإدارية تخضع للمراقبة وفق ضوابط الإدارة الداخلية.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
