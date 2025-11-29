/**
 * 根佈局 - 現代化設計
 */

import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import Providers from '@/components/Layout/providers';

export const metadata: Metadata = {
  title: '紫微斗數命盤分析 | 專業運勢解讀',
  description: '免費紫微斗數命盤排盤與深度解讀，支援陰陽曆轉換，提供性格、感情、事業、財運等全方位分析。',
  keywords: '紫微斗數, 命盤分析, 運勢, 算命, 星象, 紫微, 斗數',
  authors: [{ name: '紫微斗數命盤分析' }],
  openGraph: {
    title: '紫微斗數命盤分析',
    description: '探索千年智慧，解讀生命密碼',
    type: 'website',
    locale: 'zh_TW',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-dark-950 text-gray-100 flex flex-col min-h-screen antialiased">
        <Providers>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
