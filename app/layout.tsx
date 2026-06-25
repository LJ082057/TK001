import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TK AI Image Generator - TikTok Product Image Tool",
  description: "AI-powered product image generator for TikTok Southeast Asia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
