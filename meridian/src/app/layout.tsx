import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  // metadataBase resolves every relative canonical/OG URL in child pages
  // against the live domain — without it Next emits localhost URLs in
  // production metadata.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "InvestorSource | Australian Property Investment Marketplace",
    template: "%s | InvestorSource",
  },
  description:
    "Access Australia's property investment opportunities. InvestorSource matches investors and mortgage brokers with vetted house-and-land packages from trusted developers, guided end-to-end by our Settlement Accelerator.",
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "InvestorSource",
    locale: "en_AU",
    type: "website",
    url: SITE_URL,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
