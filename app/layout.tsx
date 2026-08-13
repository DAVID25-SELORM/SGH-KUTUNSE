import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { StructuredData } from "@/components/layout/StructuredData";
import { FirebaseAnalytics } from "@/components/analytics/FirebaseAnalytics";
import { HOSPITAL } from "@/lib/constants";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(HOSPITAL.siteUrl),
  title: {
    default: `${HOSPITAL.name} | 24/7 Healthcare in Kuntunse, Ghana`,
    template: `%s | ${HOSPITAL.name}`,
  },
  description:
    "Satellite General Hospital provides 24/7 general care, maternity, paediatrics, diagnostics, pharmacy, laboratory, specialist services and telemedicine in Kuntunse Satellite, Ghana.",
  openGraph: {
    title: `${HOSPITAL.name} | 24/7 Healthcare in Kuntunse, Ghana`,
    description:
      "Compassionate, comprehensive 24/7 healthcare for individuals, families and organisations at Satellite General Hospital.",
    url: HOSPITAL.siteUrl,
    siteName: HOSPITAL.name,
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${HOSPITAL.name} | 24/7 Healthcare in Kuntunse, Ghana`,
    description:
      "Compassionate, comprehensive 24/7 healthcare for individuals, families and organisations at Satellite General Hospital.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <head>
        <StructuredData />
      </head>
      <body className="flex min-h-full flex-col bg-white pb-16 md:pb-0">
        <FirebaseAnalytics />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <SiteChrome position="before" />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteChrome position="after" />
      </body>
    </html>
  );
}
