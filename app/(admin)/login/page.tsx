import { redirect } from 'next/navigation';
import LoginForm from '@/components/admin/LoginForm';
import { createClient } from '@/lib/supabase/server';
import { Megaphone } from 'lucide-react';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--md-surface)', fontFamily: 'var(--md-font-brand)' }}
    >
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-6">

        {/* Left panel — branding / hero */}
        <div
          className="flex flex-col justify-between rounded-[var(--md-shape-xl)] p-8 lg:p-12 min-h-[480px]"
          style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[var(--md-shape-l)]"
              style={{ background: 'var(--md-on-primary)', color: 'var(--md-primary)' }}
            >
              <Megaphone size={22} />
            </div>
            <span className="md-title-large">ISTA Ait Melloul</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="md-display-small font-bold leading-tight">
              لوحة تحكم<br />الإدارة
            </h1>
            <p className="md-body-large" style={{ opacity: 0.8 }}>
              سجّل دخولك لإدارة الإعلانات والأخبار العاجلة والفعاليات المؤسسية.
            </p>
          </div>

          {/* Footer note */}
          <p className="md-label-medium" style={{ opacity: 0.6 }}>
            نظام إدارة المحتوى الرسمي © 2025
          </p>
        </div>

        {/* Right panel — login card */}
        <div
          className="flex flex-col justify-center rounded-[var(--md-shape-xl)] p-8 lg:p-10"
          style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}
        >
          <div className="mb-8">
            <h2 className="md-headline-small" style={{ color: 'var(--md-on-surface)' }}>مرحباً بك</h2>
            <p className="md-body-medium mt-2" style={{ color: 'var(--md-on-surface-variant)' }}>
              أدخل بياناتك للوصول إلى لوحة التحكم.
            </p>
          </div>
          <LoginForm />
        </div>

      </div>
    </div>
  );
}
