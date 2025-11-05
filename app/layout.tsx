import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeCircle - Where Developers Connect, Share & Grow",
  description: "A social platform for developers to showcase their projects, receive feedback, and connect with other developers around the world.",
  keywords: ["developers", "coding", "projects", "social", "programming", "portfolio"],
  authors: [{ name: "CodeCircle Team" }],
  openGraph: {
    title: "CodeCircle - Where Developers Connect, Share & Grow",
    description: "A social platform for developers to showcase their projects, receive feedback, and connect with other developers around the world.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
