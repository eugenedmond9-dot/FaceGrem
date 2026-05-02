import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../components/LanguageProvider";
import CookieConsentBanner from "../components/CookieConsentBanner";

export const metadata: Metadata = {
  title: "FaceGrem",
  description:
    "FaceGrem is a social platform to connect, share, message, and grow your community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
          <CookieConsentBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
