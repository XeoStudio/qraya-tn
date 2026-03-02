import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "مساعد دراسة تونسي - منصة تعليمية ذكية",
  description: "منصة تعليمية ذكية للطلاب التونسيين. شرح المواد، تلخيص الدروس، أسئلة تدريبية، وبطاقات مراجعة باستخدام الذكاء الاصطناعي.",
  keywords: ["تعليم", "تونس", "دراسة", "باكالوريا", "أسئلة", "تلخيص", "ذكاء اصطناعي"],
  authors: [{ name: "مساعد دراسة تونسي" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "مساعد دراسة تونسي",
    description: "منصة تعليمية ذكية للطلاب التونسيين",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${notoSansArabic.variable} font-sans antialiased bg-background text-foreground`}
        style={{ fontFamily: 'var(--font-arabic), sans-serif' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
