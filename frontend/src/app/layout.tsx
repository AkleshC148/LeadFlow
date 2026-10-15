import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LiquidBackground } from "../components/LiquidBackground";
import { ToastProvider } from "../components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadFlow — Pipeline CRM",
  description: "Liquid glass pipeline CRM for high-velocity teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col relative bg-[#080712] text-slate-100 selection:bg-indigo-500/30 selection:text-white">
        <ToastProvider>
          <LiquidBackground />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
