
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { LayoutDashboard, TrendingUp, Users } from 'lucide-react';
import { XrayRequest, RadiationLog } from '../types';
import { XRAY_LABELS } from '../constants';

interface StatsDashboardProps {
  requests: XrayRequest[];
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ requests }) => {
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRequests = requests.filter(r => r.scheduledDate === todayStr);
    const completedAll = requests.filter(r => r.status === 'completed');
    const completedToday = todayRequests.filter(r => r.status === 'completed');
    
    const totalPoints = completedToday.reduce((sum, r) => sum + r.points, 0);
    const totalCount = completedToday.length;

    // Type breakdown - iterate through the types array of each request
    const typeMap: Record<string, number> = {};
    Object.keys(XRAY_LABELS).forEach(k => { typeMap[k] = 0; });
    
    completedToday.forEach(r => {
      r.types.forEach(t => {
        if (typeMap[t] !== undefined) typeMap[t]++;
      });
    });

    const typeData = Object.entries(XRAY_LABELS).map(([key, label]) => ({
      name: label,
      count: typeMap[key]
    })).filter(d => d.count > 0);

    // Operator breakdown
    const opMap: Record<string, number> = {};
    completedAll.forEach(r => {
      // Fix: radiationLog -> radiationLogs and safely extract the first operator name found in logs
      const firstLog = Object.values(r.radiationLogs)[0] as RadiationLog | undefined;
      const name = firstLog?.operatorName || '未指定';
      opMap[name] = (opMap[name] || 0) + 1;
    });
    const operatorData = Object.entries(opMap).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { totalPoints, totalCount, typeData, operatorData, totalToday: todayRequests.length };
  }, [requests]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <TrendingUp className="text-blue-600" />
          アナリティクス・実績
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">本日の完了依頼数</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">{stats.totalCount}</span>
            <span className="text-slate-300 font-bold">/ {stats.totalToday} 件</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">本日合計点数</h3>
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
            <span className="text-4xl font-black">{stats.totalToday - stats.totalCount}</span>
            <span className="text-slate-500 font-bold">件</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <Users size={20} className="text-blue-500" /> 担当者別 貢献度
          </h3>
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
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-emerald-500" /> 撮影種別シェア (延べ件数)
          </h3>
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
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
