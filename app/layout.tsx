import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TK AI生图 - TikTok东南亚产品图生成器",
  description: "AI驱动的产品图片生成工具，专为TikTok东南亚卖家打造",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
