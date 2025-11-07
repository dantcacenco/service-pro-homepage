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
      <head>
        <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onload = function() {
                if (window.Calendly) {
                  Calendly.initBadgeWidget({
                    url: 'https://calendly.com/volk_productions/new-meeting',
                    text: 'Schedule a Free Consultation',
                    color: '#3B82F6',
                    textColor: '#ffffff',
                    branding: true
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
