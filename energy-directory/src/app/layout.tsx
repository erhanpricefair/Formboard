import type { Metadata } from "next";
import "./globals.css";
import { TransparencyNotice } from "@/components/TransparencyNotice";

export const metadata: Metadata = {
  title: "Australian Home Energy & Retrofit Professionals Directory",
  description:
    "Find verified solar, battery, heat pump, insulation and electrification professionals near you. Independent directory — we don't sell installations or give financial advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="min-h-screen bg-white text-ink-900">
        <header className="border-b border-ink-700/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <a href="/" className="text-lg font-semibold text-brand-700">
              AU Home Energy Directory
            </a>
            <nav className="text-sm text-ink-500">
              <a href="/dashboard" className="hover:text-ink-900">
                Professional login
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-ink-700/10 bg-ink-900 py-8 text-sm text-white/70">
          <div className="mx-auto max-w-5xl space-y-3 px-4">
            <TransparencyNotice />
            <p className="text-xs text-white/50">
              &copy; {new Date().getFullYear()} AU Home Energy Directory. ABN details and licensing information for
              listed professionals are self-reported and verified on a best-efforts basis; always confirm current
              licensing directly with the relevant state authority before engaging a professional.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
