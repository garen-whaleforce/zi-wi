/**
 * 載入動畫元件
 */

'use client';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      {/* 旋轉加載動畫 */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin"></div>
      </div>

      {/* 載入文字 */}
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-gray-700">載入命盤中</p>
        <p className="text-sm text-gray-500">正在計算您的紫微斗數命盤...</p>
      </div>

      {/* 進度指示器 */}
      <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}
