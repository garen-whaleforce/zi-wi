/**
 * 頁尾元件 - 現代化設計
 */

'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/10 bg-dark-950">
      {/* 漸層裝飾線 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* 關於 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-sm">☯</span>
              </div>
              <span className="font-serif font-bold text-white">紫微斗數</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              探索千年東方智慧，以現代科技呈現傳統命理精髓，為您揭示命運的奧秘。
            </p>
          </div>

          {/* 連結 */}
          <div>
            <h4 className="font-bold text-white mb-4">快速連結</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-white/50 hover:text-gold-400 transition-colors">
                  排盤分析
                </Link>
              </li>
              <li>
                <Link href="/charts" className="text-sm text-white/50 hover:text-gold-400 transition-colors">
                  我的命盤
                </Link>
              </li>
            </ul>
          </div>

          {/* 法律聲明 */}
          <div>
            <h4 className="font-bold text-white mb-4">法律聲明</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              本網站內容僅供娛樂與自我反思參考，不構成醫療、法律、投資或其他專業意見。
            </p>
          </div>
        </div>

        {/* 分隔線 */}
        <div className="divider mb-6" />

        {/* 版權 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} 紫微斗數命盤分析。保留所有權利。
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30">
              Powered by AI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
