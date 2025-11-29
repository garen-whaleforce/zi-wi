/**
 * 命盤列表頁面
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SavedChart } from '@/lib/types';
import { getSavedCharts, deleteChart, updateChartName } from '@/lib/chartStorage';

export default function ChartsPage() {
  const router = useRouter();
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    setCharts(getSavedCharts());
  }, []);

  const handleDelete = (chartId: string) => {
    if (confirm('確定要刪除這個命盤嗎？')) {
      deleteChart(chartId);
      setCharts(getSavedCharts());
    }
  };

  const handleStartEdit = (chart: SavedChart) => {
    setEditingId(chart.chartId);
    setEditName(chart.name);
  };

  const handleSaveEdit = (chartId: string) => {
    if (editName.trim()) {
      updateChartName(chartId, editName.trim());
      setCharts(getSavedCharts());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, chartId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(chartId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 標題區 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">我的命盤</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
          >
            + 新增命盤
          </button>
        </div>

        {/* 命盤列表 */}
        {charts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h2 className="text-xl text-gray-600 mb-2">尚無已保存的命盤</h2>
            <p className="text-gray-500 mb-6">新增第一個命盤開始探索紫微斗數</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
            >
              立即排盤
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {charts.map((chart) => (
              <div
                key={chart.chartId}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {editingId === chart.chartId ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, chart.chartId)}
                        onBlur={() => handleSaveEdit(chart.chartId)}
                        autoFocus
                        className="text-lg font-semibold border-b-2 border-primary outline-none px-1"
                      />
                    ) : (
                      <h3
                        className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary"
                        onClick={() => handleStartEdit(chart)}
                      >
                        {chart.name}
                        <span className="ml-2 text-xs text-gray-400">✏️</span>
                      </h3>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{chart.gender === '男' ? '♂ 男' : '♀ 女'}</span>
                      <span>{chart.birthDate}</span>
                      <span>{chart.birthTime}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      建立於 {new Date(chart.createdAt).toLocaleDateString('zh-TW')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/chart?chartId=${chart.chartId}`)}
                      className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition"
                    >
                      查看
                    </button>
                    <button
                      onClick={() => handleDelete(chart.chartId)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 說明 */}
        {charts.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            最多可保存 20 個命盤 · 點擊名稱可編輯
          </div>
        )}
      </div>
    </div>
  );
}
