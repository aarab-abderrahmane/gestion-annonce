import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
