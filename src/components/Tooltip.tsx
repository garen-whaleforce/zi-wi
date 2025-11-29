/**
 * Tooltip 元件
 * 用於顯示星曜和宮位的說明文字
 * 使用 React Portal 避免被父容器 overflow 裁切
 */

'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [actualPosition, setActualPosition] = useState(position);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // 確保在 client 端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 計算 tooltip 位置
  useEffect(() => {
    if (isVisible && containerRef.current && mounted) {
      const container = containerRef.current.getBoundingClientRect();
      const tooltipWidth = 220; // max-w-[220px]
      const tooltipHeight = 60; // 預估高度
      const padding = 10;
      const arrowSize = 6;

      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let newPosition = position;
      let top = 0;
      let left = 0;

      // 檢查空間並決定位置
      if (position === 'top' && container.top - tooltipHeight - padding < 0) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && container.bottom + tooltipHeight + padding > viewport.height) {
        newPosition = 'top';
      } else if (position === 'left' && container.left - tooltipWidth - padding < 0) {
        newPosition = 'right';
      } else if (position === 'right' && container.right + tooltipWidth + padding > viewport.width) {
        newPosition = 'left';
      }

      // 計算位置
      switch (newPosition) {
        case 'top':
          top = container.top - tooltipHeight - arrowSize - 4;
          left = container.left + container.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = container.bottom + arrowSize + 4;
          left = container.left + container.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = container.top + container.height / 2 - tooltipHeight / 2;
          left = container.left - tooltipWidth - arrowSize - 4;
          break;
        case 'right':
          top = container.top + container.height / 2 - tooltipHeight / 2;
          left = container.right + arrowSize + 4;
          break;
      }

      // 確保不超出視窗邊界
      if (left < padding) left = padding;
      if (left + tooltipWidth > viewport.width - padding) {
        left = viewport.width - tooltipWidth - padding;
      }
      if (top < padding) top = padding;
      if (top + tooltipHeight > viewport.height - padding) {
        top = viewport.height - tooltipHeight - padding;
      }

      setActualPosition(newPosition);
      setTooltipStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
      });

      // 計算箭頭位置
      const arrowTop = newPosition === 'top' ? 'auto' : newPosition === 'bottom' ? '-6px' : '50%';
      const arrowBottom = newPosition === 'top' ? '-6px' : 'auto';
      const arrowLeft = newPosition === 'left' ? 'auto' : newPosition === 'right' ? '-6px' : '50%';
      const arrowRight = newPosition === 'left' ? '-6px' : 'auto';
      const arrowTransform = (newPosition === 'top' || newPosition === 'bottom')
        ? 'translateX(-50%)'
        : 'translateY(-50%)';

      setArrowStyle({
        position: 'absolute',
        top: arrowTop,
        bottom: arrowBottom,
        left: arrowLeft,
        right: arrowRight,
        transform: arrowTransform,
      });
    }
  }, [isVisible, position, mounted]);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // 觸控設備支援
  const handleTouchStart = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // 延遲隱藏，讓用戶有時間閱讀
    setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  const arrowClasses = {
    top: 'border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
  };

  if (!content) {
    return <>{children}</>;
  }

  const tooltipElement = isVisible && mounted ? (
    <div
      style={tooltipStyle}
      className="px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg max-w-[220px] text-left leading-relaxed animate-fade-in pointer-events-none"
      role="tooltip"
    >
      {content}
      <div
        style={arrowStyle}
        className={`w-0 h-0 border-[6px] ${arrowClasses[actualPosition]}`}
      />
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      {mounted && tooltipElement && createPortal(tooltipElement, document.body)}
    </div>
  );
}
