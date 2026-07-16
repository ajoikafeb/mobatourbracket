import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Neosoul Tournament Tracker",
    template: "%s | Neosoul Tournament Tracker",
  },
  description:
    "Indonesian Community Tournament Tracker. Track brackets, schedules, and live matches.",
  keywords: [
    "tournament",
    "MOBA",
    "esports",
    "Neosoul",
    "bracket",
    "gaming",
    "Mobile Legends",
  ],
  authors: [{ name: "Neosoul Indonesia" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Neosoul Tournament Tracker",
    title: "Neosoul Tournament Tracker",
    description:
      "Indonesian Community Tournament Tracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neosoul Tournament Tracker",
    description:
      "Indonesian Community Tournament Tracker",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#09090B] text-white">
        {children}
      </body>
    </html>
  );
}
