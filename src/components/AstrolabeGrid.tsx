/**
 * 12 宮命盤網格元件
 * 響應式設計：手機 2 列、平板 3 列、桌面 4 列
 * 支援星曜 tooltip 顯示說明
 */

'use client';

import { memo } from 'react';
import type { Palace } from '@/lib/types';
import Tooltip from './Tooltip';
import { getStarDescription, getPalaceDescription } from '@/lib/starDescriptions';

interface AstrolabeGridProps {
  palaces: Palace[];
  selectedPalace?: string;
  onPalaceSelect?: (palaceName: string) => void;
}

/**
 * 星曜顯示元件（帶 Tooltip）
 */
const StarWithTooltip = memo(function StarWithTooltip({
  name,
  isMain,
}: {
  name: string;
  isMain: boolean;
}) {
  const description = getStarDescription(name);

  const starElement = (
    <div
      className={`
        truncate text-xs sm:text-sm cursor-help
        ${isMain ? 'font-semibold text-gray-800' : 'text-gray-600'}
        hover:text-primary transition-colors
      `}
    >
      {name}
    </div>
  );

  if (description) {
    return (
      <Tooltip content={description} position="top">
        {starElement}
      </Tooltip>
    );
  }

  return starElement;
});

const PalaceButton = memo(function PalaceButton({
  palaceName,
  palace,
  isSelected,
  onClick,
  index,
}: {
  palaceName: string;
  palace?: Palace;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const palaceDescription = getPalaceDescription(palaceName);

  return (
    <button
      onClick={onClick}
      className={`
        border-2 p-2 sm:p-3 md:p-4 rounded cursor-pointer
        min-h-[80px] sm:min-h-[100px] md:min-h-[120px] text-left
        active:scale-95 touch-manipulation
        transition-all duration-200 ease-out
        animate-fade-in-up
        ${
          isSelected
            ? 'border-primary bg-primary bg-opacity-10 shadow-md'
            : 'border-gray-300 hover:border-primary hover:shadow-sm'
        }
      `}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* 宮位名稱帶 Tooltip */}
      <Tooltip content={palaceDescription || ''} position="top">
        <div className="font-bold text-sm sm:text-base md:text-lg text-primary mb-0.5 sm:mb-1 cursor-help">
          {palaceName}
        </div>
      </Tooltip>
      {palace && (
        <>
          <div className="text-xs text-gray-600 mb-1 sm:mb-2">
            {palace.stem}
            {palace.branch}
          </div>
          <div className="text-xs space-y-0.5 sm:space-y-1">
            {/* 主星 - 限制顯示數量，避免溢出 */}
            {palace.mainStars.slice(0, 3).map((star) => (
              <StarWithTooltip key={star.name} name={star.name} isMain={true} />
            ))}
            {/* 輔星 - 手機上只顯示 2 個 */}
            {palace.minorStars.slice(0, 2).map((star) => (
              <div key={star.name} className="hidden sm:block">
                <StarWithTooltip name={star.name} isMain={false} />
              </div>
            ))}
            {/* 手機上顯示更多指示 */}
            {palace.minorStars.length > 0 && (
              <div className="text-gray-400 text-xs sm:hidden">
                +{palace.minorStars.length} 輔星
              </div>
            )}
          </div>
        </>
      )}
    </button>
  );
});

function AstrolabeGridComponent({
  palaces,
  selectedPalace,
  onPalaceSelect,
}: AstrolabeGridProps) {
  // 排列順序（從命宮開始順時鐘）
  const palaceOrder = [
    '命',
    '兄弟',
    '夫妻',
    '子女',
    '父母',
    '',
    '',
    '財帛',
    '福德',
    '',
    '',
    '疾厄',
    '田宅',
    '官祿',
    '交友',
    '遷移',
  ];

  return (
    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-md">
      <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center text-primary">
        命盤（12 宮）
      </h3>
      {/* 響應式網格：手機 2 列、sm 3 列、md 4 列 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
        {palaceOrder.map((palaceName, index) => {
          if (!palaceName) {
            // 空格子在手機上隱藏
            return (
              <div
                key={index}
                className="border-2 border-transparent hidden md:block"
              />
            );
          }

          const palace = palaces.find((p) => p.name === palaceName);
          const isSelected = selectedPalace === palaceName;

          return (
            <PalaceButton
              key={index}
              palaceName={palaceName}
              palace={palace}
              isSelected={isSelected}
              onClick={() => onPalaceSelect?.(palaceName)}
              index={index}
            />
          );
        })}
      </div>

      {/* 手機上的提示 */}
      <p className="text-xs text-gray-400 text-center mt-3 sm:hidden">
        點擊宮位查看詳細解讀
      </p>
    </div>
  );
}

const AstrolabeGrid = memo(AstrolabeGridComponent);
export default AstrolabeGrid;
