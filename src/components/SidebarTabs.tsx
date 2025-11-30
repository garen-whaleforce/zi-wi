/**
 * 側邊欄 Tabs - 現代化設計
 * 顯示各面向的解釋
 */

'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import type { InterpretResult, PalaceTag, PalaceName } from '@/lib/types';

interface SidebarTabsProps {
  palaceName?: string;
  loading?: boolean;
  interpretResult?: InterpretResult | null;
}

type TabKey =
  | 'overview'
  | 'today'
  | 'life'
  | 'siblings'
  | 'marriage'
  | 'children'
  | 'wealth'
  | 'health'
  | 'travel'
  | 'friends'
  | 'career'
  | 'property'
  | 'fortune'
  | 'parents';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: '總覽', icon: '📊' },
  { key: 'today', label: '今日', icon: '📅' },
  { key: 'life', label: '命宮', icon: '⭐' },
  { key: 'siblings', label: '兄弟', icon: '👫' },
  { key: 'marriage', label: '夫妻', icon: '💑' },
  { key: 'children', label: '子女', icon: '👶' },
  { key: 'wealth', label: '財帛', icon: '💰' },
  { key: 'health', label: '疾厄', icon: '❤️' },
  { key: 'travel', label: '遷移', icon: '✈️' },
  { key: 'friends', label: '交友', icon: '🤝' },
  { key: 'career', label: '官祿', icon: '💼' },
  { key: 'property', label: '田宅', icon: '🏠' },
  { key: 'fortune', label: '福德', icon: '🙏' },
  { key: 'parents', label: '父母', icon: '👨‍👩‍👧' },
];

// 宮位名稱到 tab key 的對照表
const TAB_MAP: { [key: string]: TabKey } = {
  命宮: 'life',
  兄弟: 'siblings',
  夫妻: 'marriage',
  子女: 'children',
  財帛: 'wealth',
  疾厄: 'health',
  遷移: 'travel',
  交友: 'friends',
  僕役: 'friends',
  官祿: 'career',
  田宅: 'property',
  福德: 'fortune',
  父母: 'parents',
};

// Tab key 到宮位名稱的對照表（用於取得標籤）
const TAB_TO_PALACE: { [key in TabKey]?: PalaceName } = {
  life: '命宮',
  siblings: '兄弟',
  marriage: '夫妻',
  children: '子女',
  wealth: '財帛',
  health: '疾厄',
  travel: '遷移',
  friends: '交友',
  career: '官祿',
  property: '田宅',
  fortune: '福德',
  parents: '父母',
};

/**
 * Tab 按鈕元件
 */
const TabButton = memo(function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: { key: TabKey; label: string; icon: string };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium
        rounded-lg transition-all duration-200 whitespace-nowrap
        ${isActive
          ? 'bg-primary-900/50 text-gold-400 shadow-glow'
          : 'text-white/60 hover:text-white hover:bg-white/10'
        }
      `}
    >
      <span className="text-base">{tab.icon}</span>
      <span className="hidden sm:inline">{tab.label}</span>
    </button>
  );
});

/**
 * Loading 狀態元件
 */
const LoadingContent = memo(function LoadingContent() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-primary-500/30 border-t-gold-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg">☯</span>
        </div>
      </div>
      <p className="mt-4 text-white/60">AI 正在解讀命盤...</p>
      <p className="text-xs text-white/40 mt-1">請稍候片刻</p>
    </div>
  );
});

/**
 * 今日運勢內容元件
 */
const TodayContent = memo(function TodayContent({
  todayTodo,
  todayAvoid,
}: {
  todayTodo?: string[];
  todayAvoid?: string[];
}) {
  const hasTodo = todayTodo && todayTodo.length > 0;
  const hasAvoid = todayAvoid && todayAvoid.length > 0;

  if (!hasTodo && !hasAvoid) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">🔮</span>
        <p className="text-white/60">今日運勢載入中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 今日適合做的事 */}
      {hasTodo && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30">
          <h4 className="font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <span>✅</span> 今日宜
          </h4>
          <ul className="space-y-3">
            {todayTodo.map((item, index) => (
              <li key={index} className="flex items-start text-sm text-white/80">
                <input
                  type="checkbox"
                  className="mr-3 mt-0.5 h-4 w-4 rounded border-emerald-500/50 bg-transparent text-emerald-500 focus:ring-emerald-500/50"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 今日應避免的事 */}
      {hasAvoid && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30">
          <h4 className="font-bold text-red-400 mb-4 flex items-center gap-2">
            <span>⚠️</span> 今日忌
          </h4>
          <ul className="space-y-3">
            {todayAvoid.map((item, index) => (
              <li key={index} className="flex items-start text-sm text-white/80">
                <span className="mr-3 text-red-400">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

/**
 * 一般內容元件
 */
const GeneralContent = memo(function GeneralContent({
  content,
  todayAdvice,
  showAdvice,
}: {
  content: string;
  todayAdvice?: string[];
  showAdvice: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
        {content}
      </div>

      {/* 今日建議（只在總覽頁顯示） */}
      {showAdvice && todayAdvice && todayAdvice.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30">
          <h4 className="font-bold text-gold-400 mb-3 flex items-center gap-2">
            <span>✨</span> 今日建議
          </h4>
          <ul className="space-y-2">
            {todayAdvice.map((advice, index) => (
              <li key={index} className="flex items-start text-sm text-white/80">
                <span className="mr-2 text-gold-400">•</span>
                {advice}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

/**
 * 法律免責聲明元件
 */
const Disclaimer = memo(function Disclaimer() {
  return (
    <div className="px-4 pb-4">
      <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/40 leading-relaxed">
        ⚠️ 本內容僅供娛樂與自我反思參考，不構成任何專業意見。
      </div>
    </div>
  );
});

/**
 * 標籤分類與顏色配置
 */
const TAG_CATEGORIES = {
  // 格局類（紫色）
  pattern: {
    keywords: ['格', '同宮', '朝垣', '坐'],
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  // 四化類（金色）
  sihua: {
    keywords: ['化祿', '化權', '化科', '化忌'],
    color: 'bg-gold-500/20 text-gold-300 border-gold-500/30',
  },
  // 吉星類（綠色）
  lucky: {
    keywords: ['輔弼', '昌曲', '魁鉞', '祿馬', '貴人', '吉星', '天馬', '祿存'],
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  // 煞星類（紅色）
  unlucky: {
    keywords: ['煞', '火星', '鈴星', '擎羊', '陀羅', '空劫', '地空', '地劫'],
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  // 桃花類（粉色）
  romance: {
    keywords: ['桃花', '紅鸞', '天喜'],
    color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  // 強弱評估（藍色）
  strength: {
    keywords: ['極強', '強', '弱', '波動'],
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
};

/**
 * 根據標籤內容取得對應顏色
 */
function getTagColor(tag: string): string {
  for (const category of Object.values(TAG_CATEGORIES)) {
    if (category.keywords.some(kw => tag.includes(kw))) {
      return category.color;
    }
  }
  // 預設樣式
  return 'bg-white/10 text-white/70 border-white/20';
}

/**
 * 宮位標籤顯示元件
 */
const PalaceTagsDisplay = memo(function PalaceTagsDisplay({
  tags,
  palaceName,
}: {
  tags: string[];
  palaceName: string;
}) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="mb-4 p-3 rounded-lg bg-dark-800/50 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-white/50">分析依據</span>
        <span className="text-[10px] text-white/30">（{palaceName}）</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, index) => (
          <span
            key={index}
            className={`
              inline-block px-2 py-0.5 text-xs rounded-full border
              ${getTagColor(tag)}
            `}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
});

function SidebarTabsComponent({
  palaceName,
  loading = false,
  interpretResult,
}: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    if (palaceName && TAB_MAP[palaceName]) {
      setActiveTab(TAB_MAP[palaceName]);
    }
  }, [palaceName]);

  const handleTabClick = useCallback((tabKey: TabKey) => {
    setActiveTab(tabKey);
  }, []);

  const contentMap = useMemo(() => {
    if (!interpretResult) return null;
    return {
      overview: interpretResult.summary,
      life: interpretResult.life,
      siblings: interpretResult.siblings,
      marriage: interpretResult.marriage,
      children: interpretResult.children,
      wealth: interpretResult.wealth,
      health: interpretResult.health,
      travel: interpretResult.travel,
      friends: interpretResult.friends,
      career: interpretResult.career,
      property: interpretResult.property,
      fortune: interpretResult.fortune,
      parents: interpretResult.parents,
    };
  }, [interpretResult]);

  // 取得當前宮位的標籤
  const currentPalaceTags = useMemo(() => {
    if (!interpretResult?.palaceTags || activeTab === 'overview' || activeTab === 'today') {
      return null;
    }
    const palaceName = TAB_TO_PALACE[activeTab];
    if (!palaceName) return null;

    const palaceTag = interpretResult.palaceTags.find(pt => pt.palace === palaceName);
    return palaceTag ? { tags: palaceTag.tags, name: palaceName } : null;
  }, [interpretResult?.palaceTags, activeTab]);

  const content = useMemo(() => {
    if (loading) {
      return <LoadingContent />;
    }

    if (!interpretResult) {
      return (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block opacity-50">🔮</span>
          <p className="text-white/40">選擇宮位查看詳細解讀</p>
        </div>
      );
    }

    if (activeTab === 'today') {
      return (
        <TodayContent
          todayTodo={interpretResult.todayTodo}
          todayAvoid={interpretResult.todayAvoid}
        />
      );
    }

    if (contentMap) {
      return (
        <>
          {/* 顯示宮位標籤 */}
          {currentPalaceTags && (
            <PalaceTagsDisplay
              tags={currentPalaceTags.tags}
              palaceName={currentPalaceTags.name}
            />
          )}
          <GeneralContent
            content={contentMap[activeTab as keyof typeof contentMap]}
            todayAdvice={interpretResult.todayAdvice}
            showAdvice={activeTab === 'overview'}
          />
        </>
      );
    }

    return null;
  }, [loading, interpretResult, activeTab, contentMap, currentPalaceTags]);

  return (
    <div className="glass-card flex flex-col">
      {/* 標題 */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-lg font-serif font-bold text-gradient">命理解讀</h3>
      </div>

      {/* Tab 按鈕 */}
      <div className="px-4 pb-2">
        <div className="flex gap-1 p-1 bg-dark-800/50 rounded-xl overflow-x-auto">
          {TABS.map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              isActive={activeTab === tab.key}
              onClick={() => handleTabClick(tab.key)}
            />
          ))}
        </div>
      </div>

      {/* 分隔線 */}
      <div className="divider mx-4" />

      {/* Tab 內容 - 可滾動區域 */}
      <div className="p-4 min-h-[350px] max-h-[60vh] overflow-y-auto">{content}</div>

      {/* 法律免責聲明 */}
      <Disclaimer />
    </div>
  );
}

const SidebarTabs = memo(SidebarTabsComponent, (prevProps, nextProps) => {
  return (
    prevProps.palaceName === nextProps.palaceName &&
    prevProps.loading === nextProps.loading &&
    prevProps.interpretResult === nextProps.interpretResult
  );
});

export default SidebarTabs;
