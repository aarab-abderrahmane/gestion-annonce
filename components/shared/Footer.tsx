import Link from "next/link";
import { Building2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mx-4 mb-6 mt-16 rounded-[28px] py-14 md:mx-6" style={{ background: "var(--md-surface-container-low)" }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-3 lg:px-10">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}>
              <Building2 size={20} />
            </span>
            <h3 className="md-title-large">مؤسسة التطوير</h3>
          </div>
          <p className="md-body-medium" style={{ color: "var(--md-on-surface-variant)" }}>
            منصة مؤسسية لعرض الإعلانات الرسمية والتنبيهات العاجلة والفعاليات العامة في واجهة واحدة.
          </p>
        </div>
        <div>
          <h3 className="md-title-medium mb-5">روابط سريعة</h3>
          <div className="flex flex-col gap-3">
            <Link href="/announcements" className="md-body-medium" style={{ color: "var(--md-primary)" }}>قائمة الإعلانات</Link>
            <Link href="/important-info" className="md-body-medium" style={{ color: "var(--md-primary)" }}>تنبيهات هامة</Link>
            <Link href="/events" className="md-body-medium" style={{ color: "var(--md-primary)" }}>أرشيف الفعاليات</Link>
          </div>
        </div>
        <div>
          <h3 className="md-title-medium mb-5">تواصل معنا</h3>
          <div className="space-y-2 md-body-medium" style={{ color: "var(--md-on-surface-variant)" }}>
            <p>الهاتف الموحد: 92000XXXX</p>
            <p>البريد الإلكتروني: info@institution.sa</p>
            <p>الرياض، المملكة العربية السعودية</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
