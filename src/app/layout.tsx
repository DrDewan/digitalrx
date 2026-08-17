import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

/**
 * Both faces are self-hosted by next/font at build time. Nothing is fetched
 * from Google at runtime, so the app — and more importantly its print output —
 * behaves identically on a clinic connection that drops.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  // Deliberately not named --font-bengali: that is the Tailwind theme token,
  // which composes this one with its fallbacks.
  variable: "--font-noto-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Digital Rx",
  description: "Prescription workspace",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e1a2b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bengali.variable}`}>
      <body>{children}</body>
    </html>
  );
}
