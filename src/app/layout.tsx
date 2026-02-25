import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "자아발견 연구소",
  description: "경험 분석과 AI 인사이트를 통해 나를 더 깊이 이해하는 툴킷",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
