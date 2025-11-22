import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MigrationProvider } from "@/components/MigrationProvider";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import SessionProvider from "@/app/providers/SessionProvider";
import { PrivacyConsentGuard } from "@/components/privacy/PrivacyConsentGuard";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <MigrationProvider>
            <PrivacyConsentGuard>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </PrivacyConsentGuard>
          </MigrationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
