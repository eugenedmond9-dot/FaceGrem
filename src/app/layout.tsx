import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FaceGrem",
  description: "FaceGrem is a social platform to connect, share, message, and grow your community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}