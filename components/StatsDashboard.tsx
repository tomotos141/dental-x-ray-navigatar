
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { LayoutDashboard, TrendingUp, Users, Calendar } from 'lucide-react';
import { XrayRequest, RadiationLog } from '../types';
import { XRAY_LABELS } from '../constants';

interface StatsDashboardProps {
  requests: XrayRequest[];
}

type DatePreset = 'today' | 'week' | 'month' | 'custom';

const StatsDashboard: React.FC<StatsDashboardProps> = ({ requests }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDateFrom, setCustomDateFrom] = useState(todayStr);
  const [customDateTo, setCustomDateTo] = useState(todayStr);

  // 期間の計算
  const { dateFrom, dateTo, periodLabel } = useMemo(() => {
    const today = new Date();

    switch (datePreset) {
      case 'today':
        return {
          dateFrom: todayStr,
          dateTo: todayStr,
          periodLabel: '本日'
        };
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        return {
          dateFrom: weekAgo.toISOString().split('T')[0],
          dateTo: todayStr,
          periodLabel: '過去7日間'
        };
      }
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          dateFrom: monthStart.toISOString().split('T')[0],
          dateTo: todayStr,
          periodLabel: `${today.getFullYear()}年${today.getMonth() + 1}月`
        };
      }
      case 'custom':
        return {
          dateFrom: customDateFrom,
          dateTo: customDateTo,
          periodLabel: `${customDateFrom} 〜 ${customDateTo}`
        };
      default:
        return { dateFrom: todayStr, dateTo: todayStr, periodLabel: '本日' };
    }
  }, [datePreset, customDateFrom, customDateTo, todayStr]);

  const stats = useMemo(() => {
    // 期間内のリクエストをフィルタ
    const periodRequests = requests.filter(r =>
      r.scheduledDate >= dateFrom && r.scheduledDate <= dateTo
    );
    const completedPeriod = periodRequests.filter(r => r.status === 'completed');

    const totalPoints = completedPeriod.reduce((sum, r) => sum + r.points, 0);
    const totalCount = completedPeriod.length;

    // Type breakdown
    const typeMap: Record<string, number> = {};
    Object.keys(XRAY_LABELS).forEach(k => { typeMap[k] = 0; });

    completedPeriod.forEach(r => {
      r.types.forEach(t => {
        if (typeMap[t] !== undefined) typeMap[t]++;
      });
    });

    const typeData = Object.entries(XRAY_LABELS).map(([key, label]) => ({
      name: label,
      count: typeMap[key]
    })).filter(d => d.count > 0);

    // Operator breakdown (期間内)
    const opMap: Record<string, number> = {};
    completedPeriod.forEach(r => {
      const firstLog = Object.values(r.radiationLogs)[0] as RadiationLog | undefined;
      const name = firstLog?.operatorName || '未指定';
      opMap[name] = (opMap[name] || 0) + 1;
    });
    const operatorData = Object.entries(opMap).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalPoints,
      totalCount,
      typeData,
      operatorData,
      totalPeriod: periodRequests.length,
      pendingCount: periodRequests.filter(r => r.status === 'pending').length
    };
  }, [requests, dateFrom, dateTo]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <TrendingUp className="text-blue-600" />
          アナリティクス・実績
        </h2>

        {/* 期間選択 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['today', 'week', 'month', 'custom'] as DatePreset[]).map(preset => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  datePreset === preset
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {preset === 'today' ? '今日' :
                 preset === 'week' ? '7日間' :
                 preset === 'month' ? '今月' : 'カスタム'}
              </button>
            ))}
          </div>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
              <input
                type="date"
                value={customDateFrom}
                onChange={e => setCustomDateFrom(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs">〜</span>
              <input
                type="date"
                value={customDateTo}
                onChange={e => setCustomDateTo(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* 期間ラベル */}
      <div className="px-2">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-bold">
          <Calendar size={16} />
          {periodLabel}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">完了依頼数</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">{stats.totalCount}</span>
            <span className="text-slate-300 font-bold">/ {stats.totalPeriod} 件</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">合計点数</h3>
          <div className="flex items-baseline gap-2 text-blue-600">
            <span className="text-4xl font-black">{stats.totalPoints.toLocaleString()}</span>
            <span className="font-bold">点</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">平均単価</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">
              {stats.totalCount > 0 ? Math.round(stats.totalPoints / stats.totalCount) : 0}
            </span>
            <span className="text-slate-300 font-bold">点</span>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[32px] shadow-lg text-white">
          <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">待機中</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{stats.pendingCount}</span>
            <span className="text-slate-500 font-bold">件</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <Users size={20} className="text-blue-500" /> 担当者別 貢献度
          </h3>
          {stats.operatorData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.operatorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} width={80} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[0, 10, 10, 0]} fill="#3b82f6">
                    {stats.operatorData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400 font-bold text-sm">
              この期間のデータがありません
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-emerald-500" /> 撮影種別シェア (延べ件数)
          </h3>
          {stats.typeData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.typeData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8}>
                    {stats.typeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400 font-bold text-sm">
              この期間のデータがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
