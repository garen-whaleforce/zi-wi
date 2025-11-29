/**
 * 全局 Provider 包裝元件
 * 集中管理所有 Context Providers
 */

'use client';

import { AstrolabeProvider } from '@/contexts/AstrolabeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AstrolabeProvider>{children}</AstrolabeProvider>;
}
