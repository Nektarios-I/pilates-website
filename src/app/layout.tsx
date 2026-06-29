import type { Metadata, Viewport } from "next";
import { Fraunces, Sora } from "next/font/google";

import { siteMetadata } from "@/lib/metadata";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["WONK", "opsz"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full min-w-0 w-full max-w-full flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
