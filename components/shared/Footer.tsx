import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mx-4 mb-6 mt-16 rounded-[28px] py-14 md:mx-6" style={{ background: "var(--md-surface-container-low)" }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-3 lg:px-10">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span
                  className={ 'site-logo-ring' }
                >
                  <span
                    className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ${
                       'site-logo-ring__inner' 
                    }`}
                    style={{ background: "var(--md-surface-container-low)" }}
                  >
                    <Image
                      src="/images/ofppt-logo.jpeg"
                      alt="ISTA Ait Melloul logo"
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                </span>
            <h3 className="md-title-large">ISTA Ait Melloul</h3>
          </div>
          <p className="md-body-medium" style={{ color: "var(--md-on-surface-variant)" }}>
            منصة الإعلانات الرسمية للمعهد المتخصص للتكنولوجيا التطبيقية بأيت ملول، لعرض المستجدات والتنبيهات والفعاليات في واجهة موحدة.
          </p>
        </div>
        <div>
          <h3 className="md-title-medium mb-5">روابط سريعة</h3>
          <div className="flex flex-col gap-3">
            <Link href="/announcements" className="md-body-medium transition hover:opacity-80" style={{ color: "var(--md-primary)" }}>قائمة الإعلانات</Link>
            <Link href="/important-info" className="md-body-medium transition hover:opacity-80" style={{ color: "var(--md-primary)" }}>تنبيهات هامة</Link>
            <Link href="/events" className="md-body-medium transition hover:opacity-80" style={{ color: "var(--md-primary)" }}>أرشيف الفعاليات</Link>
          </div>
        </div>
        <div>
          <h3 className="md-title-medium mb-5">معلومات المؤسسة</h3>
          <div className="space-y-2 md-body-medium" style={{ color: "var(--md-on-surface-variant)" }}>
            <p>المؤسسة: المعهد المتخصص للتكنولوجيا التطبيقية</p>
            <p>الموقع: أيت ملول، المغرب</p>
            <p>المنصة مخصصة لنشر الإعلانات والفعاليات الرسمية الخاصة بالمؤسسة.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
