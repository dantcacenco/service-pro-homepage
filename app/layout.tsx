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
  title: "Service Pro - Business Automation Solutions",
  description: "Custom automation solutions for local service businesses. AI-powered email campaigns, customer follow-ups, and more. Built for HVAC, contractors, and service professionals.",
  keywords: ["business automation", "email marketing", "service business", "HVAC automation", "contractor software"],
  authors: [{ name: "Service Pro" }],
  openGraph: {
    title: "Service Pro - Business Automation Solutions",
    description: "Custom automation solutions for local service businesses.",
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
        {children}
      </body>
    </html>
  );
}
