/**
 * 首頁 - 現代化設計
 */

'use client';

import { useEffect, useState } from 'react';
import AstrolabeFormWizard from '@/components/AstrolabeFormWizard';

// 星星裝飾元件
function StarDecoration({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
    </svg>
  );
}

// 浮動裝飾球
function FloatingOrb({ delay = 0, size = 'md', position }: { delay?: number; size?: 'sm' | 'md' | 'lg'; position: string }) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
  };

  return (
    <div
      className={`absolute rounded-full bg-gradient-to-br from-primary-500/20 to-gold-500/20 blur-3xl ${sizeClasses[size]} ${position}`}
      style={{
        animation: `float 8s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 深色漸層背景 */}
      <div className="fixed inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-primary-950 -z-20" />

      {/* 星空效果 */}
      <div className="starfield" />

      {/* 浮動光球裝飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <FloatingOrb delay={0} size="lg" position="top-0 left-0" />
        <FloatingOrb delay={2} size="md" position="top-1/4 right-1/4" />
        <FloatingOrb delay={4} size="sm" position="bottom-1/4 left-1/3" />
      </div>

      {/* 主要內容 */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero 區域 */}
        <section className={`text-center space-y-6 mb-12 sm:mb-16 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* 裝飾星星 */}
          <div className="flex justify-center gap-4 mb-4">
            <StarDecoration className="w-4 h-4 text-gold-400 animate-pulse" />
            <StarDecoration className="w-6 h-6 text-gold-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <StarDecoration className="w-4 h-4 text-gold-400 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* 主標題 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold">
            <span className="text-gradient">紫微斗數</span>
            <br />
            <span className="text-white/90 text-3xl sm:text-4xl md:text-5xl">命盤分析</span>
          </h1>

          {/* 副標題 */}
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            探索千年智慧，解讀生命密碼
            <br className="hidden sm:block" />
            根據您的出生資訊，揭示性格特質與運勢走向
          </p>

          {/* 分隔線 */}
          <div className="divider-gold max-w-xs mx-auto" />
        </section>

        {/* 表單區域 */}
        <section className={`mb-16 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <AstrolabeFormWizard />
        </section>

        {/* 功能特色 */}
        <section className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* 特色卡片 1 */}
          <div className="glass-card p-6 text-center card-hover group">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gold-400 mb-2">完整命盤</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              展示十二宮完整命盤，包含主星、輔星與雜曜，傳統方形佈局清晰易讀
            </p>
          </div>

          {/* 特色卡片 2 */}
          <div className="glass-card p-6 text-center card-hover group">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-gold group-hover:shadow-lg transition-shadow duration-300">
              <svg className="w-8 h-8 text-dark-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gold-400 mb-2">AI 深度解讀</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              結合傳統命理與現代心理學，提供性格、感情、事業、財運等全方位分析
            </p>
          </div>

          {/* 特色卡片 3 */}
          <div className="glass-card p-6 text-center card-hover group">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-700 to-gold-600 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gold-400 mb-2">運勢查詢</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              支援本命、大限、流年、流月、流日查詢，掌握各時段運勢變化
            </p>
          </div>
        </section>

        {/* 統計數據 */}
        <section className={`glass-card p-8 mb-16 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gradient mb-1">12</div>
              <div className="text-sm text-white/60">十二宮分析</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gradient-gold mb-1">108+</div>
              <div className="text-sm text-white/60">星曜組合</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gradient mb-1">5</div>
              <div className="text-sm text-white/60">運限層級</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gradient-gold mb-1">AI</div>
              <div className="text-sm text-white/60">智能解讀</div>
            </div>
          </div>
        </section>

        {/* 免責聲明 */}
        <section className={`text-center transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
            本網站內容僅供娛樂與自我反思參考，不構成醫療、法律、投資或其他專業意見。
            若有相關問題，請尋求專業人士協助。
          </p>
        </section>
      </main>
    </div>
  );
}
