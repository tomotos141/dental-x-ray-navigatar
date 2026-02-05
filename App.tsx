
import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle, LayoutDashboard, History, User, FileText, Save, Trash2, ListTodo,
  MapPin, X, Zap, Search, ClipboardCheck, Users, Settings, UserPlus, Info,
  Cake, UserRound, ArrowRight, ArrowLeft, CheckCircle2, Database, Calendar as CalendarIcon, AlertTriangle, Filter
} from 'lucide-react';
import { XrayRequest, XrayType, RadiationLog, ClinicAuth, Patient, Operator, StaffRole, Gender, BodyType, AgeCategory } from './types';
import { INSURANCE_POINTS, XRAY_LABELS, LOCATION_OPTIONS, EXPOSURE_TEMPLATES } from './constants';
import DentalChart from './components/DentalChart';
import StatsDashboard from './components/StatsDashboard';
import { useDentalData } from './hooks/useDentalData';

const calculateAge = (birthdayStr: string, baseDateStr: string = new Date().toISOString().split('T')[0]): number => {
  if (!birthdayStr) return 0;
  const birthDate = new Date(birthdayStr);
  const baseDate = new Date(baseDateStr);
  let age = baseDate.getFullYear() - birthDate.getFullYear();
  const m = baseDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && baseDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getAgeCategory = (age: number): AgeCategory => age < 12 ? 'child' : 'adult';

const App: React.FC = () => {
  const [auth, setAuth] = useState<ClinicAuth | null>(null);
  const [view, setView] = useState<'request' | 'tasks' | 'stats' | 'history' | 'patients' | 'patient-detail'>('request');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { patients, requests, loading, savePatient, deletePatient: deletePatientDb, addRequest, updateRequest } = useDentalData();
  const [operators, setOperators] = useState<Operator[]>([]);

  const [loginClinicId, setLoginClinicId] = useState('');
  const [loginStaffName, setLoginStaffName] = useState('');
  const [logModalTask, setLogModalTask] = useState<XrayRequest | null>(null);
  const [tempLogs, setTempLogs] = useState<Partial<Record<XrayType, RadiationLog>>>({});

  const [deleteConfirmPatient, setDeleteConfirmPatient] = useState<Patient | null>(null);

  // 履歴検索フィルタ
  const [historySearchText, setHistorySearchText] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<XrayType | ''>('');

  const pendingCount = useMemo(() => requests.filter(r => r.status === 'pending').length, [requests]);

  // フィルタリングされた履歴
  const filteredHistory = useMemo(() => {
    return requests.filter(r => {
      if (r.status !== 'completed') return false;

      // テキスト検索（患者名 or ID）
      if (historySearchText) {
        const searchLower = historySearchText.toLowerCase();
        const matchName = r.patientName.toLowerCase().includes(searchLower);
        const matchId = r.patientId.toLowerCase().includes(searchLower);
        if (!matchName && !matchId) return false;
      }

      // 日付範囲
      if (historyDateFrom && r.scheduledDate < historyDateFrom) return false;
      if (historyDateTo && r.scheduledDate > historyDateTo) return false;

      // 撮影種別
      if (historyTypeFilter && !r.types.includes(historyTypeFilter)) return false;

      return true;
    });
  }, [requests, historySearchText, historyDateFrom, historyDateTo, historyTypeFilter]);

  // Keep operators local for now
  useEffect(() => {
    const savedOperators = localStorage.getItem(`dentx_operators_global`);
    if (savedOperators) setOperators(JSON.parse(savedOperators));
  }, []);

  useEffect(() => {
    localStorage.setItem(`dentx_operators_global`, JSON.stringify(operators));
  }, [operators]);

  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientGender, setPatientGender] = useState<Gender>('male');
  const [patientBirthday, setPatientBirthday] = useState('');
  const [patientBodyType, setPatientBodyType] = useState<BodyType>('normal');
  const [isFoundInDb, setIsFoundInDb] = useState(false);

  const [selectedXrayTypes, setSelectedXrayTypes] = useState<XrayType[]>(['PANORAMA']);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [bitewingSides, setBitewingSides] = useState<('right' | 'left')[]>([]);
  const [notes, setNotes] = useState('');
  const [locationTo, setLocationTo] = useState('待合室');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState(`${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`);

  const currentAge = useMemo(() => calculateAge(patientBirthday, scheduledDate), [patientBirthday, scheduledDate]);
  const ageCategory = useMemo(() => getAgeCategory(currentAge), [currentAge]);

  const needsToothSelection = useMemo(() => {
    const toothBasedTypes: XrayType[] = ['DENTAL', 'BITEWING', 'CT'];
    return selectedXrayTypes.some(t => toothBasedTypes.includes(t));
  }, [selectedXrayTypes]);

  const currentPoints = useMemo(() => {
    return selectedXrayTypes.reduce((sum, t) => {
      let points = INSURANCE_POINTS[t].basePoints;
      if (t === 'BITEWING') {
        const count = bitewingSides.length || 0;
        points *= count;
      }
      return sum + points;
    }, 0);
  }, [selectedXrayTypes, bitewingSides]);

  const handlePatientIdChange = (id: string) => {
    setPatientId(id);
    const found = patients.find(p => p.id === id);
    if (found) {
      setPatientName(found.name);
      setPatientGender(found.gender);
      setPatientBirthday(found.birthday);
      setPatientBodyType(found.bodyType);
      setIsFoundInDb(true);
    } else {
      setPatientName('');
      setPatientGender('male');
      setPatientBirthday('');
      setPatientBodyType('normal');
      setIsFoundInDb(false);
    }
  };

  const handleToggleTeethRange = (range: number[]) => {
    const allSelected = range.every(id => selectedTeeth.includes(id));
    if (allSelected) {
      setSelectedTeeth(prev => prev.filter(id => !range.includes(id)));
    } else {
      setSelectedTeeth(prev => Array.from(new Set([...prev, ...range])));
    }
  };

  const toggleBitewingSide = (side: 'right' | 'left') => {
    setBitewingSides(prev => prev.includes(side) ? prev.filter(s => s !== side) : [...prev, side]);
  };

  const handleSaveRequest = async () => {
    if (!patientName || !patientId || !patientBirthday) return alert('患者情報を正しく入力してください');
    if (selectedXrayTypes.length === 0) return alert('撮影種別を選択してください');
    if (selectedXrayTypes.includes('BITEWING') && bitewingSides.length === 0) return alert('バイトウィングの撮影側（右・左）を選択してください');

    await savePatient({
      id: patientId,
      name: patientName,
      gender: patientGender,
      birthday: patientBirthday,
      bodyType: patientBodyType
    });

    const requestData: XrayRequest = {
      id: Math.random().toString(36).substr(2, 9),
      patientName, patientId, patientGender, patientBirthday, patientAgeAtRequest: currentAge, patientBodyType,
      types: selectedXrayTypes, selectedTeeth, bitewingSides: selectedXrayTypes.includes('BITEWING') ? bitewingSides : undefined,
      notes, locationFrom: '診察室', locationTo, scheduledDate, scheduledTime, points: currentPoints,
      timestamp: new Date(), status: 'pending', radiationLogs: {}
    };

    await addRequest(requestData);
    setView('tasks');
    resetForm();
  };

  const resetForm = () => {
    setPatientId(''); setPatientName(''); setPatientGender('male'); setPatientBirthday(''); setPatientBodyType('normal'); setIsFoundInDb(false);
    setSelectedXrayTypes(['PANORAMA']); setSelectedTeeth([]); setBitewingSides([]); setNotes('');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setScheduledTime(`${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`);
  };

  const handleDeletePatient = (patient: Patient) => {
    setDeleteConfirmPatient(patient);
  };

  const confirmDeletePatient = async () => {
    if (!deleteConfirmPatient) return;
    await deletePatientDb(deleteConfirmPatient.id);
    setDeleteConfirmPatient(null);
  };

  const openLogModal = (task: XrayRequest) => {
    setLogModalTask(task);
    const initialLogs: Partial<Record<XrayType, RadiationLog>> = {};
    const ageCat = getAgeCategory(task.patientAgeAtRequest);

    task.types.forEach(type => {
      const template = EXPOSURE_TEMPLATES[type][ageCat][task.patientBodyType];
      initialLogs[type] = {
        ...template,
        operatorName: auth?.staffName || (operators.length > 0 ? operators[0].name : '')
      };
    });
    setTempLogs(initialLogs);
  };

  const saveAllLogs = async () => {
    if (!logModalTask) return;
    await updateRequest({ ...logModalTask, status: 'completed', radiationLogs: tempLogs });
    setLogModalTask(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100"><Zap className="text-white fill-current" size={20} /></div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-slate-900 leading-none">{auth?.clinicId || "Imaging Suite"}</h1>
            <p className="text-[10px] text-blue-500 font-black mt-1 uppercase tracking-tighter">{auth?.staffName || 'Guest'} さん</p>
          </div>
        </div>
        <nav className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          <button onClick={() => setView('request')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${view === 'request' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><PlusCircle size={14} /><span>新規依頼</span></button>
          <button onClick={() => setView('tasks')} className={`px-4 py-2 rounded-xl text-xs font-bold relative ${view === 'tasks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><ListTodo size={14} /><span>タスク</span>{pendingCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{pendingCount}</span>}</button>
          <button onClick={() => setView('stats')} className={`px-4 py-2 rounded-xl text-xs font-bold ${view === 'stats' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><LayoutDashboard size={14} /><span>実績</span></button>
          <button onClick={() => setView('history')} className={`px-4 py-2 rounded-xl text-xs font-bold ${view === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><History size={14} /><span>履歴</span></button>
          <button onClick={() => setView('patients')} className={`px-4 py-2 rounded-xl text-xs font-bold ${view === 'patients' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><Users size={14} /><span>患者管理</span></button>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {!auth ? (
          <div className="max-w-md mx-auto mt-20 bg-white p-10 rounded-[40px] shadow-2xl space-y-8 animate-in zoom-in duration-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-100"><Zap className="text-white fill-current" size={40} /></div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">DentX Navigator</h2>
              <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">Digital Imaging Management</p>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="医院 ID" value={loginClinicId} onChange={e => setLoginClinicId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="スタッフ名" value={loginStaffName} onChange={e => setLoginStaffName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => setAuth({ clinicId: loginClinicId, staffName: loginStaffName })} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100 transition-transform active:scale-95">ログイン</button>
            </div>
          </div>
        ) : (
          <>
            {view === 'request' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="lg:col-span-1 space-y-6">
                  <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><UserRound className="text-blue-500" size={20} /> 患者情報</h2>
                      {isFoundInDb && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black animate-in fade-in zoom-in">
                          <Database size={10} /> 既登録
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="text"
                          placeholder="患者 ID"
                          value={patientId}
                          onChange={e => handlePatientIdChange(e.target.value)}
                          className="w-full pl-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="患者氏名"
                        value={patientName}
                        onChange={e => setPatientName(e.target.value)}
                        className={`w-full px-4 py-4 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white transition-all ${isFoundInDb ? 'bg-slate-50 cursor-not-allowed opacity-80' : 'bg-slate-50'}`}
                      />

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 ml-1 uppercase flex items-center gap-1"><Cake size={10} /> 生年月日 & 年齢</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={patientBirthday}
                            onChange={e => setPatientBirthday(e.target.value)}
                            className={`flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold outline-none text-xs ${isFoundInDb ? 'bg-slate-50 opacity-80' : 'bg-slate-50'}`}
                          />
                          <div className={`px-4 py-3 rounded-xl flex items-center justify-center font-black min-w-[80px] text-xs ${ageCategory === 'child' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                            {currentAge}歳 ({ageCategory === 'child' ? '小児' : '成人'})
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">体格 (テンプレート自動選択)</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['small', 'normal', 'large'] as BodyType[]).map(bt => (
                            <button key={bt} onClick={() => setPatientBodyType(bt)} className={`flex flex-col items-center py-3 rounded-xl border transition-all ${patientBodyType === bt ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                              <span className={`text-xl mb-1 ${bt === 'small' ? 'scale-75' : bt === 'large' ? 'scale-125' : ''}`}>👤</span>
                              <span className="text-[10px] font-black">{bt === 'small' ? '小柄' : bt === 'normal' ? '普通' : '大柄'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3"><FileText className="text-blue-500" size={20} /> 撮影種別</h2>
                    <div className="grid grid-cols-1 gap-2">
                      {(Object.keys(XRAY_LABELS) as XrayType[]).map(type => (
                        <div key={type} className="flex flex-col gap-2">
                          <button onClick={() => setSelectedXrayTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])} className={`w-full text-left px-4 py-3 rounded-xl border font-bold transition-all flex justify-between items-center ${selectedXrayTypes.includes(type) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'}`}>
                            <span className="text-sm">{XRAY_LABELS[type]}</span>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black leading-none">{INSURANCE_POINTS[type].basePoints}点</span>
                              <span className={`text-[8px] font-bold mt-1 ${selectedXrayTypes.includes(type) ? 'text-blue-200' : 'text-slate-400'}`}>
                                [{EXPOSURE_TEMPLATES[type][ageCategory][patientBodyType].kv}kV]
                              </span>
                            </div>
                          </button>

                          {/* バイトウィング左右選択UI */}
                          {type === 'BITEWING' && selectedXrayTypes.includes('BITEWING') && (
                            <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-300 px-1 mb-2">
                              <button onClick={() => toggleBitewingSide('right')} className={`py-2 rounded-lg text-[10px] font-black border transition-all ${bitewingSides.includes('right') ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200'}`}>右側 (R)</button>
                              <button onClick={() => toggleBitewingSide('left')} className={`py-2 rounded-lg text-[10px] font-black border transition-all ${bitewingSides.includes('left') ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200'}`}>左側 (L)</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">撮影部位指定 (歯式)</h2>
                      <div className="text-blue-600 font-black text-xl tabular-nums">{currentPoints} <span className="text-xs">点</span></div>
                    </div>
                    {needsToothSelection ? (
                      <DentalChart
                        selectedTeeth={selectedTeeth}
                        onToggleTooth={id => setSelectedTeeth(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])}
                        onToggleTeethRange={handleToggleTeethRange}
                      />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-2xl">🦷</div>
                        <h3 className="text-lg font-black text-slate-800 mb-1">全顎撮影</h3>
                        <p className="text-sm font-bold text-slate-400">現在選択中の項目では詳細な歯式指定は不要です。</p>
                      </div>
                    )}
                  </section>

                  <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
                    <h2 className="text-sm font-black text-slate-700 flex items-center gap-2 px-2"><CalendarIcon size={16} className="text-blue-500" /> 撮影予約設定</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 ml-1">撮影先</label>
                        <select value={locationTo} onChange={e => setLocationTo(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500">
                          {LOCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 ml-1">予約日</label>
                        <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 ml-1">予約時刻</label>
                        <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <button onClick={handleSaveRequest} className="w-full bg-blue-600 text-white px-12 py-5 rounded-2xl font-black shadow-lg hover:shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg mt-2"><Save size={24} />撮影依頼を送信</button>
                  </section>
                </div>
              </div>
            )}

            {view === 'tasks' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {requests.filter(r => r.status === 'pending').map(task => (
                  <div key={task.id} className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 space-y-6 hover:border-blue-400 transition-all relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-2xl font-black tabular-nums shadow-lg">{task.scheduledTime}</div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-300 uppercase">日付: {task.scheduledDate}</div>
                        <div className="text-xs font-black text-slate-500">{task.patientAgeAtRequest}歳 / {task.patientBodyType === 'small' ? '小柄' : task.patientBodyType === 'normal' ? '普通' : '大柄'}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-3xl font-black text-slate-900 leading-tight">{task.patientName}</h4>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest font-mono">患者ID: {task.patientId}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {task.types.map(t => (
                          <span key={t} className="bg-white text-blue-600 px-4 py-2 rounded-full text-[10px] font-black border border-blue-100 shadow-sm">
                            {XRAY_LABELS[t]}
                            {t === 'BITEWING' && task.bitewingSides && ` (${task.bitewingSides.map(s => s === 'right' ? '右' : '左').join('・')})`}
                          </span>
                        ))}
                      </div>
                      {task.selectedTeeth.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200">
                          {task.selectedTeeth.sort((a, b) => a - b).map(t => <span key={t} className="text-[10px] font-black text-slate-500 px-2 py-1 bg-white rounded-lg border border-slate-200">{t}</span>)}
                        </div>
                      )}
                    </div>
                    <button onClick={() => openLogModal(task)} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"><ClipboardCheck size={24} />撮影完了・照射録記録</button>
                  </div>
                ))}
                {pendingCount === 0 && (
                  <div className="col-span-full py-20 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                      <ListTodo size={40} />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">現在待機中の撮影はありません</p>
                  </div>
                )}
              </div>
            )}

            {view === 'history' && (
              <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-3"><History className="text-blue-500" /> 撮影完了履歴</h2>
                    <div className="text-sm font-bold text-slate-400">{filteredHistory.length} 件</div>
                  </div>
                  {/* 検索フィルタ */}
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">患者名 / ID</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                          type="text"
                          placeholder="検索..."
                          value={historySearchText}
                          onChange={e => setHistorySearchText(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="min-w-[150px]">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">開始日</label>
                      <input
                        type="date"
                        value={historyDateFrom}
                        onChange={e => setHistoryDateFrom(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="min-w-[150px]">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">終了日</label>
                      <input
                        type="date"
                        value={historyDateTo}
                        onChange={e => setHistoryDateTo(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="min-w-[150px]">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">撮影種別</label>
                      <select
                        value={historyTypeFilter}
                        onChange={e => setHistoryTypeFilter(e.target.value as XrayType | '')}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">すべて</option>
                        {(Object.keys(XRAY_LABELS) as XrayType[]).map(type => (
                          <option key={type} value={type}>{XRAY_LABELS[type]}</option>
                        ))}
                      </select>
                    </div>
                    {(historySearchText || historyDateFrom || historyDateTo || historyTypeFilter) && (
                      <button
                        onClick={() => {
                          setHistorySearchText('');
                          setHistoryDateFrom('');
                          setHistoryDateTo('');
                          setHistoryTypeFilter('');
                        }}
                        className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors"
                      >
                        クリア
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-6">日時</th>
                        <th className="px-8 py-6">患者詳細</th>
                        <th className="px-8 py-6">撮影項目</th>
                        <th className="px-8 py-6">照射条件 (kV/mA/sec)</th>
                        <th className="px-8 py-6 text-right">保険点数</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map(r => (
                        <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-8 py-5">
                            <div className="font-bold text-slate-700">{r.scheduledDate}</div>
                            <div className="text-xs text-slate-400">{r.scheduledTime}</div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="font-black text-slate-900">{r.patientName} <span className="text-xs text-slate-400 ml-1 font-bold">({r.patientAgeAtRequest}歳)</span></div>
                            <div className="text-[10px] text-slate-400 font-bold">ID: {r.patientId} / {r.patientBodyType === 'small' ? '小柄' : r.patientBodyType === 'normal' ? '普通' : '大柄'}</div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-wrap gap-1">
                              {r.types.map(t => (
                                <span key={t} className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                  {XRAY_LABELS[t]}
                                  {t === 'BITEWING' && r.bitewingSides && ` (${r.bitewingSides.map(s => s === 'right' ? '右' : '左').join('・')})`}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="space-y-1">
                              {(Object.entries(r.radiationLogs) as [string, RadiationLog][]).map(([type, log]) => (
                                <div key={type} className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2 py-1 rounded border border-blue-50">
                                  <span className="text-slate-400 w-16 truncate">{XRAY_LABELS[type as XrayType]}:</span>
                                  <span>{log.kv}kV</span> / <span>{log.ma}mA</span> / <span>{log.sec}s</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right font-black text-slate-900 tabular-nums">{r.points.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === 'patients' && (
              <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-3"><Users className="text-blue-500" /> 患者データベース</h2>
                  <div className="text-xs font-bold text-slate-400">{patients.length} 名の登録済み患者</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-6">ID</th>
                        <th className="px-8 py-6">氏名</th>
                        <th className="px-8 py-6">生年月日</th>
                        <th className="px-8 py-6">体格設定</th>
                        <th className="px-8 py-6 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patients.map(p => (
                        <tr
                          key={p.id}
                          className="hover:bg-blue-50 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedPatient(p);
                            setView('patient-detail');
                          }}
                        >
                          <td className="px-8 py-5 font-mono font-bold text-slate-500">{p.id}</td>
                          <td className="px-8 py-5 font-black text-slate-900">{p.name}</td>
                          <td className="px-8 py-5 font-bold text-slate-600">{p.birthday}</td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.bodyType === 'small' ? 'bg-emerald-100 text-emerald-700' : p.bodyType === 'normal' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {p.bodyType === 'small' ? '小柄' : p.bodyType === 'normal' ? '普通' : '大柄'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePatient(p);
                              }}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-xl"
                            >
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === 'patient-detail' && selectedPatient && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* ヘッダー: 戻るボタン + 患者情報 */}
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => setView('patients')}
                      className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6"
                    >
                      <ArrowLeft size={20} />
                      <span className="font-bold text-sm">患者一覧に戻る</span>
                    </button>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-3xl font-black text-slate-900">{selectedPatient.name}</h2>
                        <p className="text-sm font-bold text-slate-400 mt-2">
                          ID: <span className="font-mono">{selectedPatient.id}</span>
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="bg-slate-100 px-4 py-2 rounded-xl text-center">
                          <div className="text-[10px] font-black text-slate-400 uppercase">生年月日</div>
                          <div className="text-sm font-bold text-slate-700">{selectedPatient.birthday}</div>
                        </div>
                        <div className="bg-slate-100 px-4 py-2 rounded-xl text-center">
                          <div className="text-[10px] font-black text-slate-400 uppercase">年齢</div>
                          <div className="text-sm font-bold text-slate-700">{calculateAge(selectedPatient.birthday)}歳</div>
                        </div>
                        <div className="bg-slate-100 px-4 py-2 rounded-xl text-center">
                          <div className="text-[10px] font-black text-slate-400 uppercase">性別</div>
                          <div className="text-sm font-bold text-slate-700">{selectedPatient.gender === 'male' ? '男性' : '女性'}</div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-center ${selectedPatient.bodyType === 'small' ? 'bg-emerald-100' : selectedPatient.bodyType === 'normal' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                          <div className="text-[10px] font-black text-slate-400 uppercase">体格</div>
                          <div className={`text-sm font-bold ${selectedPatient.bodyType === 'small' ? 'text-emerald-700' : selectedPatient.bodyType === 'normal' ? 'text-blue-700' : 'text-amber-700'}`}>
                            {selectedPatient.bodyType === 'small' ? '小柄' : selectedPatient.bodyType === 'normal' ? '普通' : '大柄'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 撮影履歴 */}
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                      <History className="text-blue-500" /> 撮影履歴
                    </h3>
                  </div>
                  {requests.filter(r => r.patientId === selectedPatient.id && r.status === 'completed').length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <tr>
                            <th className="px-8 py-6">日時</th>
                            <th className="px-8 py-6">撮影項目</th>
                            <th className="px-8 py-6">照射条件 (kV/mA/sec)</th>
                            <th className="px-8 py-6">担当者</th>
                            <th className="px-8 py-6 text-right">保険点数</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {requests
                            .filter(r => r.patientId === selectedPatient.id && r.status === 'completed')
                            .map(r => (
                              <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                                <td className="px-8 py-5">
                                  <div className="font-bold text-slate-700">{r.scheduledDate}</div>
                                  <div className="text-xs text-slate-400">{r.scheduledTime}</div>
                                </td>
                                <td className="px-8 py-5">
                                  <div className="flex flex-wrap gap-1">
                                    {r.types.map(t => (
                                      <span key={t} className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                        {XRAY_LABELS[t]}
                                        {t === 'BITEWING' && r.bitewingSides && ` (${r.bitewingSides.map(s => s === 'right' ? '右' : '左').join('・')})`}
                                      </span>
                                    ))}
                                  </div>
                                  {r.selectedTeeth.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {r.selectedTeeth.sort((a, b) => a - b).map(t => (
                                        <span key={t} className="text-[8px] font-bold text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded">
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="px-8 py-5">
                                  <div className="space-y-1">
                                    {(Object.entries(r.radiationLogs) as [string, RadiationLog][]).map(([type, log]) => (
                                      <div key={type} className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2 py-1 rounded border border-blue-50">
                                        <span className="text-slate-400 w-16 truncate">{XRAY_LABELS[type as XrayType]}:</span>
                                        <span>{log.kv}kV</span> / <span>{log.ma}mA</span> / <span>{log.sec}s</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-8 py-5">
                                  <span className="text-sm font-bold text-slate-600">
                                    {(Object.values(r.radiationLogs) as RadiationLog[])[0]?.operatorName || '-'}
                                  </span>
                                </td>
                                <td className="px-8 py-5 text-right font-black text-slate-900 tabular-nums">{r.points.toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <History className="text-slate-300" size={32} />
                      </div>
                      <p className="text-slate-400 font-bold text-sm">撮影履歴がありません</p>
                    </div>
                  )}
                </div>

                {/* 予定中タスク */}
                {requests.filter(r => r.patientId === selectedPatient.id && r.status === 'pending').length > 0 && (
                  <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-amber-50/50">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <ListTodo className="text-amber-500" /> 予定中のタスク
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requests
                        .filter(r => r.patientId === selectedPatient.id && r.status === 'pending')
                        .map(task => (
                          <div key={task.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="bg-amber-600 text-white px-3 py-1 rounded-lg text-sm font-black">
                                {task.scheduledTime}
                              </div>
                              <div className="text-xs font-bold text-amber-600">{task.scheduledDate}</div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {task.types.map(t => (
                                <span key={t} className="text-[10px] font-black bg-white text-amber-700 px-2 py-1 rounded border border-amber-200">
                                  {XRAY_LABELS[t]}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === 'stats' && <StatsDashboard requests={requests} />}
          </>
        )}
      </main>

      {/* 削除確認モーダル */}
      {deleteConfirmPatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">患者データの削除</h3>
            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-8">
              <span className="text-slate-900 font-black">「{deleteConfirmPatient.name}」</span> 様の情報をデータベースから完全に削除しますか？<br />
              この操作は取り消せません。
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteConfirmPatient(null)}
                className="py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm active:scale-95 transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDeletePatient}
                className="py-4 rounded-2xl bg-red-600 text-white font-black text-sm shadow-lg shadow-red-200 active:scale-95 transition-all"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {logModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-blue-600 p-8 text-white relative flex-shrink-0">
              <button onClick={() => setLogModalTask(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"><X size={28} /></button>
              <h3 className="text-2xl font-black flex items-center gap-4"><CheckCircle2 size={32} />撮影条件の最終確認</h3>
              <p className="text-blue-100 mt-2 font-bold opacity-90">{logModalTask.patientName} 様 ({logModalTask.patientAgeAtRequest}歳 / {logModalTask.patientBodyType === 'small' ? '小柄' : logModalTask.patientBodyType === 'normal' ? '普通' : '大柄'})</p>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              {logModalTask.types.map(type => (
                <div key={type} className="bg-slate-50 border border-slate-200 rounded-[32px] p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="font-black text-slate-800 text-lg">{XRAY_LABELS[type]} {type === 'BITEWING' && logModalTask.bitewingSides && ` (${logModalTask.bitewingSides.map(s => s === 'right' ? '右' : '左').join('・')})`}</span>
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight">テンプレート適用済</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {['kv', 'ma', 'sec'].map(field => (
                      <div key={field} className="space-y-2 text-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field}</label>
                        <input
                          type="number"
                          step={field === 'sec' ? '0.01' : '1'}
                          value={tempLogs[type]?.[field as keyof RadiationLog] || 0}
                          onChange={e => setTempLogs({
                            ...tempLogs,
                            [type]: { ...tempLogs[type], [field]: Number(e.target.value) }
                          })}
                          className="w-full bg-white border border-slate-200 rounded-2xl px-2 py-4 text-2xl font-black text-blue-600 outline-none text-center shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="space-y-2 px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">署名 (撮影担当者)</label>
                <input
                  type="text"
                  value={tempLogs[logModalTask.types[0]]?.operatorName || ''}
                  onChange={e => {
                    const newLogs = { ...tempLogs };
                    logModalTask.types.forEach(t => { if (newLogs[t]) newLogs[t]!.operatorName = e.target.value; });
                    setTempLogs(newLogs);
                  }}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="スタッフ名を入力"
                />
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex-shrink-0">
              <button onClick={saveAllLogs} className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"><Save size={24} />撮影記録を確定保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
