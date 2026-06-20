import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ExamMind — AI Wellness Companion for Exam Students",
  description: "Track your mood, understand stress patterns, and stay mentally strong through NEET, JEE, CAT, GATE, UPSC preparation.",
  keywords: ["mental wellness", "exam stress", "NEET", "JEE", "student wellbeing", "mood tracker"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}