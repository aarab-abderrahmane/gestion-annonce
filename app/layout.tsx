import type { Metadata } from "next";
import ServiceWorkerRegistration from "@/components/shared/ServiceWorkerRegistration";
import NetworkIndicator from "@/components/ui/NetworkIndicator";
import ToastProvider from "@/components/ui/ToastProvider";
import { getSiteUrl, SITE_TITLE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: SITE_TITLE,
  description: "المنصة الرسمية للإعلانات والفعاليات والمعلومات المهمة الخاصة بـ ISTA Ait Melloul.",
  openGraph: {
    title: SITE_TITLE,
    description: "المنصة الرسمية للإعلانات والفعاليات والمعلومات المهمة الخاصة بـ ISTA Ait Melloul.",
    siteName: SITE_TITLE,
    locale: "ar_MA",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ToastProvider>
          <ServiceWorkerRegistration />
          <NetworkIndicator />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
