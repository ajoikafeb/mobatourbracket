import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#FF7A00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Neosoul Tournament Tracker",
    template: "%s | Neosoul Tournament Tracker",
  },
  description:
    "Indonesian Community Mobile Legends Tournament Tracker. Track brackets, schedules, and live matches in real-time.",
  keywords: [
    "tournament",
    "MOBA",
    "esports",
    "Neosoul",
    "bracket",
    "gaming",
    "Mobile Legends",
    "Indonesia",
    "community tournament",
  ],
  authors: [{ name: "Neosoul Indonesia" }],
  creator: "Neosoul Indonesia",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://neosoulid.vercel.app",
    siteName: "Neosoul Tournament Tracker",
    title: "Neosoul Tournament Tracker",
    description:
      "Indonesian Community Mobile Legends Tournament Tracker. Track brackets, schedules, and live matches in real-time.",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Neosoul Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Neosoul Tournament Tracker",
    description:
      "Indonesian Community Mobile Legends Tournament Tracker. Track brackets, schedules, and live matches in real-time.",
    images: ["/logo.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
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
