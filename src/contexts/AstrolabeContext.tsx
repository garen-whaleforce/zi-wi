/**
 * 命盤狀態管理 Context
 * 使用 useReducer 管理複雜狀態
 */

'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Astrolabe, FortuneData, InterpretResult, FortuneScope } from '@/lib/types';
import { getChart, saveChart } from '@/lib/chartStorage';

// ============ State Types ============

interface AstrolabeState {
  // 命盤資料
  astrolabe: Astrolabe | null;
  chartId: string | null;

  // 運勢資料
  fortune: FortuneData | null;
  fortuneScope: FortuneScope;
  fortuneParams: {
    decadeRange?: { start: number; end: number };
    year: number;
    month: number;
    day: number;
  };

  // 解讀結果
  interpretResult: InterpretResult | null;

  // UI 狀態
  selectedPalace: string | undefined;

  // 載入狀態
  loading: boolean;
  loadingMessage: string;
  interpreting: boolean;

  // 錯誤狀態
  error: string | null;
}

// ============ Action Types ============

type AstrolabeAction =
  | { type: 'SET_CHART_ID'; payload: string | null }
  | { type: 'SET_ASTROLABE'; payload: Astrolabe | null }
  | { type: 'SET_FORTUNE'; payload: FortuneData | null }
  | {
      type: 'SET_FORTUNE_SCOPE';
      payload: {
        scope: AstrolabeState['fortuneScope'];
        params: AstrolabeState['fortuneParams'];
      };
    }
  | { type: 'SET_INTERPRET_RESULT'; payload: InterpretResult | null }
  | { type: 'SET_SELECTED_PALACE'; payload: string | undefined }
  | { type: 'SET_LOADING'; payload: { loading: boolean; message?: string } }
  | { type: 'SET_INTERPRETING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// ============ Initial State ============

const getInitialState = (): AstrolabeState => {
  const today = new Date();
  return {
    astrolabe: null,
    chartId: null,
    fortune: null,
    fortuneScope: 'natal',
    fortuneParams: {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    },
    interpretResult: null,
    selectedPalace: undefined,
    loading: false,
    loadingMessage: '',
    interpreting: false,
    error: null,
  };
};

// ============ Reducer ============

function astrolabeReducer(
  state: AstrolabeState,
  action: AstrolabeAction
): AstrolabeState {
  switch (action.type) {
    case 'SET_CHART_ID':
      return { ...state, chartId: action.payload };

    case 'SET_ASTROLABE':
      return { ...state, astrolabe: action.payload, error: null };

    case 'SET_FORTUNE':
      return { ...state, fortune: action.payload };

    case 'SET_FORTUNE_SCOPE':
      return {
        ...state,
        fortuneScope: action.payload.scope,
        fortuneParams: action.payload.params,
      };

    case 'SET_INTERPRET_RESULT':
      return { ...state, interpretResult: action.payload };

    case 'SET_SELECTED_PALACE':
      return { ...state, selectedPalace: action.payload };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload.loading,
        loadingMessage: action.payload.message || '',
      };

    case 'SET_INTERPRETING':
      return { ...state, interpreting: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'RESET':
      return getInitialState();

    default:
      return state;
  }
}

// ============ Context Types ============

interface AstrolabeContextType {
  state: AstrolabeState;
  dispatch: React.Dispatch<AstrolabeAction>;

  // 便捷方法
  loadAstrolabe: (chartId: string) => Promise<void>;
  loadFortune: (
    scope: AstrolabeState['fortuneScope'],
    params: AstrolabeState['fortuneParams']
  ) => Promise<FortuneData | null>;
  loadInterpretation: (fortuneOverride?: FortuneData | null) => Promise<void>;
  selectPalace: (palaceName: string | undefined) => void;
  reset: () => void;
}

// ============ Context ============

const AstrolabeContext = createContext<AstrolabeContextType | null>(null);

// ============ Provider ============

export function AstrolabeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(astrolabeReducer, undefined, getInitialState);

  // 載入命盤
  const loadAstrolabe = useCallback(async (chartId: string) => {
    dispatch({ type: 'SET_CHART_ID', payload: chartId });
    dispatch({ type: 'SET_LOADING', payload: { loading: true, message: '載入命盤中...' } });

    try {
      // 嘗試從 localStorage 載入
      const savedChart = getChart(chartId);
      if (savedChart) {
        dispatch({ type: 'SET_ASTROLABE', payload: savedChart });
        dispatch({ type: 'SET_LOADING', payload: { loading: false } });
        return;
      }

      // 如果沒有，從 API 載入
      const response = await fetch(`/api/astrolabe/${chartId}`);
      if (!response.ok) {
        throw new Error('無法載入命盤');
      }

      const data = await response.json();
      dispatch({ type: 'SET_ASTROLABE', payload: data.astrolabe });

      // 保存到 localStorage
      saveChart(data.astrolabe);

      dispatch({ type: 'SET_LOADING', payload: { loading: false } });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : '載入命盤失敗',
      });
    }
  }, []);

  // 載入運勢（並返回新的 fortune 資料）
  const loadFortune = useCallback(
    async (
      scope: AstrolabeState['fortuneScope'],
      params: AstrolabeState['fortuneParams']
    ): Promise<FortuneData | null> => {
      dispatch({ type: 'SET_FORTUNE_SCOPE', payload: { scope, params } });

      if (scope === 'natal' || !state.astrolabe) {
        dispatch({ type: 'SET_FORTUNE', payload: null });
        return null;
      }

      try {
        const response = await fetch('/api/fortune', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            astrolabe: state.astrolabe,
            scope,
            ...params,
          }),
        });

        if (!response.ok) {
          throw new Error('無法載入運勢');
        }

        const fortune = await response.json();
        dispatch({ type: 'SET_FORTUNE', payload: fortune });
        return fortune as FortuneData;
      } catch (error) {
        console.error('載入運勢失敗:', error);
        dispatch({ type: 'SET_FORTUNE', payload: null });
        return null;
      }
    },
    [state.astrolabe]
  );

  // 載入解讀（接受可選的 fortune 參數以確保使用最新值）
  const loadInterpretation = useCallback(async (fortuneOverride?: FortuneData | null) => {
    if (!state.astrolabe) return;

    // 使用傳入的 fortune 或 state 中的 fortune
    const fortuneToUse = fortuneOverride !== undefined ? fortuneOverride : state.fortune;

    dispatch({ type: 'SET_INTERPRETING', payload: true });
    // 不清除舊結果，讓用戶在載入期間還能看到之前的內容

    try {
      console.log('載入解讀，fortune scope:', fortuneToUse?.scope || 'natal');

      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astrolabe: state.astrolabe,
          fortune: fortuneToUse,
          topics: ['all'],
        }),
      });

      if (!response.ok) {
        throw new Error('無法載入解讀');
      }

      const data = await response.json();
      // API 直接返回 InterpretResult，不是包在 { result: ... } 裡面
      dispatch({ type: 'SET_INTERPRET_RESULT', payload: data });
    } catch (error) {
      console.error('載入解讀失敗:', error);
    } finally {
      dispatch({ type: 'SET_INTERPRETING', payload: false });
    }
  }, [state.astrolabe, state.fortune]);

  // 選擇宮位
  const selectPalace = useCallback((palaceName: string | undefined) => {
    dispatch({ type: 'SET_SELECTED_PALACE', payload: palaceName });
  }, []);

  // 重置狀態
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const contextValue: AstrolabeContextType = {
    state,
    dispatch,
    loadAstrolabe,
    loadFortune,
    loadInterpretation,
    selectPalace,
    reset,
  };

  return (
    <AstrolabeContext.Provider value={contextValue}>
      {children}
    </AstrolabeContext.Provider>
  );
}

// ============ Hook ============

export function useAstrolabe() {
  const context = useContext(AstrolabeContext);
  if (!context) {
    throw new Error('useAstrolabe must be used within an AstrolabeProvider');
  }
  return context;
}

// 選擇性 hooks（效能優化）
export function useAstrolabeData() {
  const { state } = useAstrolabe();
  return {
    astrolabe: state.astrolabe,
    chartId: state.chartId,
    loading: state.loading,
    error: state.error,
  };
}

export function useFortuneData() {
  const { state, loadFortune } = useAstrolabe();
  return {
    fortune: state.fortune,
    scope: state.fortuneScope,
    params: state.fortuneParams,
    loadFortune,
  };
}

export function useInterpretData() {
  const { state, loadInterpretation } = useAstrolabe();
  return {
    interpretResult: state.interpretResult,
    interpreting: state.interpreting,
    loadInterpretation,
  };
}

export function useSelectedPalace() {
  const { state, selectPalace } = useAstrolabe();
  return {
    selectedPalace: state.selectedPalace,
    selectPalace,
  };
}
