/**
 * 傳統命盤方形佈局元件
 * 按照紫微斗數傳統方形排列：外圈 12 宮，中心顯示基本資訊
 */

'use client';

import { memo, useState } from 'react';
import type { Palace, Astrolabe } from '@/lib/types';
import Tooltip from './Tooltip';
import { getStarDescription, getPalaceDescription } from '@/lib/starDescriptions';

interface TraditionalChartProps {
  astrolabe: Astrolabe;
  selectedPalace?: string;
  onPalaceSelect?: (palaceName: string) => void;
}

// 傳統排列順序（從右上角命宮開始，逆時針）
// 格子位置對應：
//   4  3  2  1
//   5  中 中 12
//   6  中 中 11
//   7  8  9  10
const PALACE_POSITIONS = [
  { name: '命', gridArea: 'p1', position: 'top-right' },
  { name: '父母', gridArea: 'p2', position: 'top' },
  { name: '福德', gridArea: 'p3', position: 'top' },
  { name: '田宅', gridArea: 'p4', position: 'top-left' },
  { name: '官祿', gridArea: 'p5', position: 'left' },
  { name: '交友', gridArea: 'p6', position: 'left' },
  { name: '遷移', gridArea: 'p7', position: 'bottom-left' },
  { name: '疾厄', gridArea: 'p8', position: 'bottom' },
  { name: '財帛', gridArea: 'p9', position: 'bottom' },
  { name: '子女', gridArea: 'p10', position: 'bottom-right' },
  { name: '夫妻', gridArea: 'p11', position: 'right' },
  { name: '兄弟', gridArea: 'p12', position: 'right' },
];

// 宮位顏色映射
const PALACE_COLORS: Record<string, string> = {
  命: 'from-palace-life/20 to-palace-life/5 border-palace-life/50',
  兄弟: 'from-palace-siblings/20 to-palace-siblings/5 border-palace-siblings/50',
  夫妻: 'from-palace-spouse/20 to-palace-spouse/5 border-palace-spouse/50',
  子女: 'from-palace-children/20 to-palace-children/5 border-palace-children/50',
  財帛: 'from-palace-wealth/20 to-palace-wealth/5 border-palace-wealth/50',
  疾厄: 'from-palace-health/20 to-palace-health/5 border-palace-health/50',
  遷移: 'from-palace-travel/20 to-palace-travel/5 border-palace-travel/50',
  交友: 'from-palace-friends/20 to-palace-friends/5 border-palace-friends/50',
  官祿: 'from-palace-career/20 to-palace-career/5 border-palace-career/50',
  田宅: 'from-palace-property/20 to-palace-property/5 border-palace-property/50',
  福德: 'from-palace-fortune/20 to-palace-fortune/5 border-palace-fortune/50',
  父母: 'from-palace-parents/20 to-palace-parents/5 border-palace-parents/50',
};

// 星曜標籤顏色
function getStarColorClass(starName: string): string {
  // 四化判斷
  if (starName.includes('化祿')) return 'text-green-400';
  if (starName.includes('化權')) return 'text-amber-400';
  if (starName.includes('化科')) return 'text-blue-400';
  if (starName.includes('化忌')) return 'text-red-400';

  // 煞星
  const unluckyStars = ['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫'];
  if (unluckyStars.some(s => starName.includes(s))) return 'text-red-300';

  // 吉星
  const luckyStars = ['左輔', '右弼', '天魁', '天鉞', '文昌', '文曲', '祿存', '天馬'];
  if (luckyStars.some(s => starName.includes(s))) return 'text-emerald-300';

  return 'text-white/90';
}

// 單一宮位格子
const PalaceCell = memo(function PalaceCell({
  palace,
  palaceName,
  isSelected,
  onClick,
  gridArea,
}: {
  palace?: Palace;
  palaceName: string;
  isSelected: boolean;
  onClick: () => void;
  gridArea: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const palaceDescription = getPalaceDescription(palaceName);
  const colorClass = PALACE_COLORS[palaceName] || 'from-white/10 to-white/5 border-white/20';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative p-2 sm:p-3 rounded-xl text-left
        bg-gradient-to-br ${colorClass}
        border backdrop-blur-sm
        transition-all duration-300 ease-out
        ${isSelected
          ? 'ring-2 ring-gold-400 shadow-glow scale-[1.02] z-10'
          : 'hover:scale-[1.02] hover:shadow-lg'
        }
        ${isHovered ? 'z-10' : ''}
      `}
      style={{ gridArea }}
    >
      {/* 宮位名稱 */}
      <Tooltip content={palaceDescription || ''} position="top">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs sm:text-sm font-bold text-gold-400">
            {palaceName}宮
          </span>
          {palace && (
            <span className="text-xs text-white/40">
              {palace.stem}{palace.branch}
            </span>
          )}
        </div>
      </Tooltip>

      {/* 星曜列表 */}
      {palace && (
        <div className="space-y-0.5">
          {/* 主星 */}
          {palace.mainStars.map((star) => {
            const description = getStarDescription(star.name);
            return (
              <Tooltip key={star.name} content={description || ''} position="top">
                <div className={`text-xs sm:text-sm font-semibold truncate cursor-help ${getStarColorClass(star.name)}`}>
                  {star.name}
                </div>
              </Tooltip>
            );
          })}

          {/* 輔星（僅顯示前幾個） */}
          {palace.minorStars.slice(0, 3).map((star) => {
            const description = getStarDescription(star.name);
            return (
              <Tooltip key={star.name} content={description || ''} position="top">
                <div className={`text-xs truncate cursor-help ${getStarColorClass(star.name)} opacity-80`}>
                  {star.name}
                </div>
              </Tooltip>
            );
          })}

          {/* 更多指示 */}
          {palace.minorStars.length > 3 && (
            <div className="text-xs text-white/30">
              +{palace.minorStars.length - 3}
            </div>
          )}
        </div>
      )}

      {/* 選中指示器 */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
      )}
    </button>
  );
});

// 中心資訊區
const CenterInfo = memo(function CenterInfo({ astrolabe }: { astrolabe: Astrolabe }) {
  return (
    <div
      className="
        rounded-xl p-4
        bg-gradient-to-br from-primary-900/80 to-primary-950/80
        border-2 border-gold-500/30
        backdrop-blur-md
        flex flex-col items-center justify-center
        text-center
        shadow-inner-glow
      "
      style={{ gridArea: 'center' }}
    >
      {/* 裝飾圖案 */}
      <div className="relative mb-3">
        <div className="w-16 h-16 rounded-full border-2 border-gold-400/50 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-gold-400/30 flex items-center justify-center">
            <span className="text-2xl">☯</span>
          </div>
        </div>
        <div className="absolute inset-0 rounded-full animate-spin-slow opacity-30">
          <div className="absolute top-0 left-1/2 w-1 h-1 rounded-full bg-gold-400 -translate-x-1/2" />
          <div className="absolute bottom-0 left-1/2 w-1 h-1 rounded-full bg-gold-400 -translate-x-1/2" />
          <div className="absolute left-0 top-1/2 w-1 h-1 rounded-full bg-gold-400 -translate-y-1/2" />
          <div className="absolute right-0 top-1/2 w-1 h-1 rounded-full bg-gold-400 -translate-y-1/2" />
        </div>
      </div>

      {/* 基本資訊 */}
      <div className="space-y-1">
        {astrolabe.name && (
          <div className="text-lg font-serif font-bold text-gold-400">
            {astrolabe.name}
          </div>
        )}
        <div className="text-sm text-white/70">
          {astrolabe.gender === '男' ? '乾造' : '坤造'}
        </div>
        <div className="text-xs text-white/50">
          {astrolabe.birthDate}
        </div>
        <div className="text-xs text-white/50">
          {astrolabe.birthTime}
        </div>
      </div>
    </div>
  );
});

export default function TraditionalChart({
  astrolabe,
  selectedPalace,
  onPalaceSelect,
}: TraditionalChartProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 標題 */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-serif font-bold text-gradient">紫微斗數命盤</h3>
        <p className="text-sm text-white/50">點擊宮位查看詳細解讀</p>
      </div>

      {/* 傳統方形命盤 */}
      <div
        className="
          grid gap-1 sm:gap-2 p-2 sm:p-4
          bg-dark-900/50 backdrop-blur-sm rounded-2xl
          border border-white/10 shadow-glass-lg
        "
        style={{
          gridTemplateAreas: `
            "p4  p3  p2  p1"
            "p5  center center p12"
            "p6  center center p11"
            "p7  p8  p9  p10"
          `,
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, minmax(80px, 1fr))',
          aspectRatio: '1',
        }}
      >
        {/* 十二宮位 */}
        {PALACE_POSITIONS.map((pos) => {
          const palace = astrolabe.palaces.find((p) => p.name === pos.name);
          return (
            <PalaceCell
              key={pos.name}
              palace={palace}
              palaceName={pos.name}
              isSelected={selectedPalace === pos.name}
              onClick={() => onPalaceSelect?.(pos.name)}
              gridArea={pos.gridArea}
            />
          );
        })}

        {/* 中心資訊 */}
        <CenterInfo astrolabe={astrolabe} />
      </div>

      {/* 圖例 */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-white/50">化祿/吉星</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-white/50">化權</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-white/50">化科</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-white/50">化忌/煞星</span>
        </div>
      </div>
    </div>
  );
}
