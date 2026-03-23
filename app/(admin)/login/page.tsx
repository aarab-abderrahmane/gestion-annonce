import { redirect } from 'next/navigation';
import Image from 'next/image';
import LoginForm from '@/components/admin/LoginForm';
import { createClient } from '@/lib/supabase/server';
import { ShieldCheck } from 'lucide-react';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: isAdmin, error } = await supabase.rpc('is_admin');
    if (!error && isAdmin) redirect('/dashboard');
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f7faf9 0%, #eef5f3 55%, #f4f7f6 100%)',
        fontFamily: 'var(--md-font-brand)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(0, 106, 96, 0.08), transparent 34%), radial-gradient(circle at bottom left, rgba(77, 95, 124, 0.08), transparent 30%)',
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div
          className="grid w-full max-w-[1080px] overflow-hidden rounded-[34px] border bg-white shadow-[0_24px_70px_rgba(17,44,58,0.10)] lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]"
          style={{ borderColor: 'rgba(111, 121, 119, 0.18)' }}
          dir="ltr"
        >
          <div dir="rtl" className="border-b px-8 py-8 sm:px-10 lg:border-b-0 lg:border-l" style={{ borderColor: 'var(--md-outline-variant)' }}>
            <div className="mb-8 mt-6 space-y-2">
              <h2 className="text-[1.35rem] font-semibold" style={{ color: 'var(--md-on-surface)' }}>
                تسجيل الدخول
              </h2>
              <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                أدخل البريد الإلكتروني وكلمة المرور للمتابعة.
              </p>
            </div>

            <LoginForm />

            <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--md-outline)' }}>
              جميع محاولات الولوج تخضع للمراقبة وفق ضوابط الإدارة.
            </p>
          </div>

          <div
            dir="rtl"
            className="flex items-center px-8 py-10 sm:px-10 lg:px-12 lg:py-12 border-l border-gray-300"
            style={{ background: '#f8fbfa' }}
          >
            <div className="w-full max-w-[460px] space-y-8 ">
              <div className="space-y-6">
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2"
                  style={{
                    borderColor: 'rgba(111, 121, 119, 0.18)',
                    background: '#ffffff',
                    color: 'var(--md-on-surface-variant)',
                  }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--md-primary)' }} />
                  <span className="md-label-large">بوابة الإدارة</span>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="flex h-18 w-18 shrink-0 items-center justify-center rounded-[24px] border"
                    style={{ borderColor: 'rgba(111, 121, 119, 0.18)', background: '#ffffff' }}
                  >
                    <Image
                      src="/images/ofppt-logo.jpeg"
                      alt="شعار المعهد"
                      width={52}
                      height={52}
                      className="rounded-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-3">
                
                    <h1 className="text-[1.9rem] font-semibold leading-[1.5]" style={{ color: '#17363d' }}>
                      المعهد المتخصص للتكنولوجيا التطبيقية بأيت ملول
                    </h1>
                    <p className="md-body-medium leading-8" style={{ color: '#566765' }}>
                      الولوج إلى لوحة الإدارة الخاصة بتدبير الإعلانات والفعاليات والمستجدات الرسمية.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-[24px] border px-5 py-5"
                style={{ borderColor: 'rgba(111, 121, 119, 0.18)', background: '#ffffff' }}
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--md-primary)' }} />
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold" style={{ color: '#17363d' }}>
                      تنبيه الولوج
                    </h3>
                    <p className="text-[13px] leading-6" style={{ color: '#5f706d' }}>
                      هذا الولوج مخصص للأطر المخول لها تدبير المنصة. يرجى استعمال بيانات الحساب الرسمية المعتمدة من الإدارة.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
