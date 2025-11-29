-- Supabase Schema for 紫微斗數命盤應用
-- 在 Supabase SQL Editor 執行此腳本建立資料表

-- 命盤資料表
CREATE TABLE IF NOT EXISTS charts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('男', '女')),
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Taipei',
  chart_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 解讀結果快取表
CREATE TABLE IF NOT EXISTS interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id TEXT REFERENCES charts(id) ON DELETE CASCADE,
  fortune_scope TEXT NOT NULL,
  fortune_params JSONB NOT NULL DEFAULT '{}',
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chart_id, fortune_scope, fortune_params)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_charts_user_id ON charts(user_id);
CREATE INDEX IF NOT EXISTS idx_charts_created_at ON charts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interpretations_chart_id ON interpretations(chart_id);

-- 啟用 Row Level Security (RLS)
ALTER TABLE charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpretations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: 匿名使用者可以讀寫自己的資料（使用 chart_id 識別）
-- 注意：這是簡化版本，實際應用可能需要更嚴格的權限控制

-- 允許任何人讀取命盤（用於分享功能）
CREATE POLICY "Charts are viewable by everyone" ON charts
  FOR SELECT USING (true);

-- 允許任何人建立命盤
CREATE POLICY "Anyone can create charts" ON charts
  FOR INSERT WITH CHECK (true);

-- 允許建立者更新命盤
CREATE POLICY "Anyone can update charts" ON charts
  FOR UPDATE USING (true);

-- 允許建立者刪除命盤
CREATE POLICY "Anyone can delete charts" ON charts
  FOR DELETE USING (true);

-- 解讀結果的 RLS 政策
CREATE POLICY "Interpretations are viewable by everyone" ON interpretations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create interpretations" ON interpretations
  FOR INSERT WITH CHECK (true);

-- 建立更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_charts_updated_at
  BEFORE UPDATE ON charts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
