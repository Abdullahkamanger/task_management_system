import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import Sidebar from '@/components/SideBar';
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Management",
  description: "Task management system",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="h-full flex overflow-hidden bg-[#1d1d1d]" suppressHydrationWarning>
        <Toaster richColors position="top-right" />
        
        {/* Sidebar stays fixed, only shown if logged in */}
        {session && <Sidebar user={session.user} />}

        {/* This main area is what scrolls/changes */}
        <main className="flex-1 relative flex flex-col p-6 overflow-y-auto custom-scrollbar">
          {children}
        </main>
        
      </body>
    </html>
  );
}
