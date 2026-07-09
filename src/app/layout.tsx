import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropertyConnect",
  description: "Australia's property connection platform — Melbourne launch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className="antialiased">{children}</body>
    </html>
  );
}
