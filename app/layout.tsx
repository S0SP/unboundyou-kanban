import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UnboundYou CRM",
  description: "Premium Lead Management, Ticketing, and Kanban Board for UnboundYou Counselors.",
  icons: {
    icon: "https://testing-unboundyou.vercel.app/logo.svg",
    apple: "https://testing-unboundyou.vercel.app/logo.svg",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full bg-background text-foreground antialiased selection:bg-primary selection:text-white inter">
        {children}
      </body>
    </html>
  );
}
