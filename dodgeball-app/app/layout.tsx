import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MigrationProvider } from "@/components/MigrationProvider";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DodgeballHub",
  description: "초등학교 피구 경기 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        <MigrationProvider>
          <NavBar />
          <div style={{ height: 'calc(100vh - 4rem - 3rem)', overflow: 'hidden' }}>
            {children}
          </div>
          <Footer />
        </MigrationProvider>
      </body>
    </html>
  );
}
