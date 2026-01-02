
import React from 'react';

interface DentalChartProps {
  selectedTeeth: number[];
  onToggleTooth: (toothId: number) => void;
  onToggleTeethRange: (toothIds: number[]) => void;
}

const DentalChart: React.FC<DentalChartProps> = ({ selectedTeeth, onToggleTooth, onToggleTeethRange }) => {
  // Tooth IDs (FDI system)
  const quadrants = [
    { id: 1, range: [18, 17, 16, 15, 14, 13, 12, 11], label: '右上', range47: [14, 15, 16, 17] },
    { id: 2, range: [21, 22, 23, 24, 25, 26, 27, 28], label: '左上', range47: [24, 25, 26, 27] },
    { id: 4, range: [48, 47, 46, 45, 44, 43, 42, 41], label: '右下', range47: [44, 45, 46, 47] },
    { id: 3, range: [31, 32, 33, 34, 35, 36, 37, 38], label: '左下', range47: [34, 35, 36, 37] },
  ];

  const all47Ids = [...quadrants[0].range47, ...quadrants[1].range47, ...quadrants[2].range47, ...quadrants[3].range47];
  const isAll47Selected = all47Ids.every(id => selectedTeeth.includes(id));

  const ToothButton: React.FC<{ id: number }> = ({ id }) => {
    const isSelected = selectedTeeth.includes(id);
    const lastDigit = id % 10;
    
    return (
      <button
        onClick={() => onToggleTooth(id)}
        className={`
          w-10 h-14 flex flex-col items-center justify-center border rounded-lg transition-all active:scale-90
          ${isSelected 
            ? 'bg-blue-600 border-blue-700 text-white shadow-md scale-105 z-10' 
            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'}
        `}
      >
        <span className="text-[9px] font-bold opacity-70 mb-1">{id}</span>
        <span className="text-base font-black">{lastDigit}</span>
      </button>
    );
  };

  const RangeButton: React.FC<{ label: string, ids: number[], subLabel?: string }> = ({ label, ids, subLabel }) => {
    const allInThisRangeSelected = ids.every(id => selectedTeeth.includes(id));
    return (
      <button
        onClick={() => onToggleTeethRange(ids)}
        className={`
          px-3 py-2 h-14 min-w-[60px] flex flex-col items-center justify-center border rounded-xl transition-all active:scale-95 shadow-sm
          ${allInThisRangeSelected 
            ? 'bg-slate-800 border-slate-900 text-white' 
            : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}
        `}
      >
        <span className="text-[10px] font-black leading-none">{label}</span>
        {subLabel && <span className="text-[8px] mt-1 opacity-70 font-bold">{subLabel}</span>}
      </button>
    );
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-200 overflow-x-auto">
      <div className="min-w-[700px] flex flex-col gap-6">
        
        {/* Upper Row */}
        <div className="flex justify-center gap-12">
          {/* Quadrant 1 (UR) */}
          <div className="flex items-center gap-3">
            <RangeButton label="臼歯" subLabel="4-7" ids={quadrants[0].range47} />
            <div className="flex gap-1.5">
              {quadrants[0].range.map(id => <ToothButton key={id} id={id} />)}
            </div>
          </div>
          {/* Quadrant 2 (UL) */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {quadrants[1].range.map(id => <ToothButton key={id} id={id} />)}
            </div>
            <RangeButton label="臼歯" subLabel="4-7" ids={quadrants[1].range47} />
          </div>
        </div>

        {/* Mid line with Master Control */}
        <div className="h-px bg-slate-200 relative my-4">
          <div className="absolute left-1/2 -top-5 -translate-x-1/2 flex items-center gap-4 bg-white px-6">
             <button 
               onClick={() => onToggleTeethRange(all47Ids)}
               className={`
                 px-6 py-2 rounded-full border text-[11px] font-black transition-all shadow-lg flex items-center gap-2
                 ${isAll47Selected 
                   ? 'bg-blue-600 border-blue-700 text-white' 
                   : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'}
               `}
             >
               🦷 全臼歯(4-7)を一括選択 / 解除
             </button>
             <span className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">Occlusal Plane</span>
          </div>
        </div>

        {/* Lower Row */}
        <div className="flex justify-center gap-12">
          {/* Quadrant 4 (LR) */}
          <div className="flex items-center gap-3">
            <RangeButton label="臼歯" subLabel="4-7" ids={quadrants[2].range47} />
            <div className="flex gap-1.5">
              {quadrants[2].range.map(id => <ToothButton key={id} id={id} />)}
            </div>
          </div>
          {/* Quadrant 3 (LL) */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {quadrants[3].range.map(id => <ToothButton key={id} id={id} />)}
            </div>
            <RangeButton label="臼歯" subLabel="4-7" ids={quadrants[3].range47} />
          </div>
        </div>

      </div>

      <div className="mt-10 flex justify-center gap-8 border-t border-slate-50 pt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded-md"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">選択中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-800 rounded-md"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">臼歯一括</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-slate-200 rounded-md"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">未選択</span>
        </div>
      </div>
    </div>
  );
};

export default DentalChart;
