/**
 * 命盤頁面 - 現代化設計
 * 使用 Context 管理狀態
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TraditionalChart from '@/components/TraditionalChart';
import SidebarTabs from '@/components/SidebarTabs';
import FortuneMatrix from '@/components/FortuneMatrix';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { FortuneScope } from '@/lib/types';
import {
  useAstrolabe,
  useAstrolabeData,
  useFortuneData,
  useInterpretData,
  useSelectedPalace,
} from '@/contexts/AstrolabeContext';

function ChartContent() {
  const searchParams = useSearchParams();
  const chartId = searchParams.get('chartId');
  const [mounted, setMounted] = useState(false);

  // 使用 Context hooks
  const { loadAstrolabe, loadInterpretation } = useAstrolabe();
  const { astrolabe, loading, error } = useAstrolabeData();
  const { fortune, scope: fortuneScope, params: fortuneParams, loadFortune } = useFortuneData();
  const { interpretResult, interpreting } = useInterpretData();
  const { selectedPalace, selectPalace } = useSelectedPalace();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 載入命盤
  useEffect(() => {
    if (chartId) {
      loadAstrolabe(chartId);
    }
  }, [chartId, loadAstrolabe]);

  // 命盤載入後自動載入解讀（只在首次載入時）
  useEffect(() => {
    if (astrolabe && !interpretResult && !interpreting) {
      loadInterpretation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [astrolabe]); // 只依賴 astrolabe，避免 interpretResult 變化時重複觸發

  // 處理 FortuneMatrix 選擇
  const handleMatrixSelect = async (
    scope: FortuneScope,
    params: {
      decadeRange?: { start: number; end: number };
      year?: number;
      month?: number;
      day?: number;
    }
  ) => {
    const today = new Date();
    const fullParams = {
      decadeRange: params.decadeRange,
      year: params.year || today.getFullYear(),
      month: params.month || today.getMonth() + 1,
      day: params.day || today.getDate(),
    };
    const newFortune = await loadFortune(scope, fullParams);
    loadInterpretation(newFortune);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-white/60">載入命盤中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-xl font-bold text-red-400 mb-2">載入錯誤</p>
          <p className="text-white/60 mb-6">{error}</p>
          <a href="/" className="btn-primary inline-block">
            返回首頁
          </a>
        </div>
      </div>
    );
  }

  if (!astrolabe) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl font-bold text-amber-400 mb-2">無法載入命盤</p>
          <p className="text-white/60 mb-6">請返回首頁重新進行排盤</p>
          <a href="/" className="btn-primary inline-block">
            返回首頁
          </a>
        </div>
      </div>
    );
  }

  // 取得出生年份（用於 FortuneSelector）
  const birthYear = astrolabe.birthDate
    ? parseInt(astrolabe.birthDate.split('-')[0])
    : undefined;

  return (
    <div className="min-h-screen relative">
      {/* 深色漸層背景 */}
      <div className="fixed inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-primary-950 -z-20" />

      {/* 星空效果 */}
      <div className="starfield" />

      {/* 主要內容 */}
      <main className={`relative z-10 max-w-7xl mx-auto px-4 py-20 sm:py-24 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        {/* 頁面標題 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gradient mb-2">
            {astrolabe.name ? `${astrolabe.name}的命盤` : '命盤分析'}
          </h1>
          <p className="text-white/60">
            {astrolabe.gender === '男' ? '乾造' : '坤造'} · {astrolabe.birthDate} · {astrolabe.birthTime}
          </p>
        </div>

        {/* 運勢時間軸矩陣 - 放在顯眼位置 */}
        {birthYear && (
          <div className={`mb-6 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <FortuneMatrix
              birthYear={birthYear}
              selected={{
                scope: fortuneScope,
                decadeRange: fortuneParams.decadeRange,
                year: fortuneParams.year,
                month: fortuneParams.month,
                day: fortuneParams.day,
              }}
              onSelect={handleMatrixSelect}
            />
          </div>
        )}

        {/* 主要內容區 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* 左側：傳統命盤 */}
          <div className={`transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <TraditionalChart
              astrolabe={astrolabe}
              selectedPalace={selectedPalace}
              onPalaceSelect={selectPalace}
            />
          </div>

          {/* 右側：解釋 Tabs */}
          <div className={`transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <SidebarTabs
              palaceName={selectedPalace}
              loading={interpreting}
              interpretResult={interpretResult}
            />
          </div>
        </div>


        {/* 工具列 */}
        <div className={`mt-8 flex justify-center gap-4 transition-all duration-500 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => window.print()}
            className="btn-ghost flex items-center gap-2 text-white/60 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            列印
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('連結已複製！');
            }}
            className="btn-ghost flex items-center gap-2 text-white/60 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            分享
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ChartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <LoadingSpinner />
      </div>
    }>
      <ChartContent />
    </Suspense>
  );
}
