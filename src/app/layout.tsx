import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "游泳课预约系统",
  description: "游泳课预约系统 v0.1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
