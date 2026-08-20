import React, { useState } from 'react';
import { BodyRecord, DateRangeOption } from '../types/bodyComposition';
import { filterRecordsByDateRange, prepareChartData, prepareWeeklyData } from '../services/analytics';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  Bar,
  LabelList,
} from 'recharts';
import { TrendingUp, Filter, Eye } from 'lucide-react';

interface ChartsViewProps {
  records: BodyRecord[];
}

export const ChartsView: React.FC<ChartsViewProps> = ({ records }) => {
  const [rangeOption, setRangeOption] = useState<DateRangeOption>('all');
  const [showSma, setShowSma] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'main' | 'weekly' | 'balance' | 'segmental' | 'bmi'>('main');

  const filtered = filterRecordsByDateRange(records, { range: rangeOption });
  const chartData = prepareChartData(filtered);
  const weeklyData = prepareWeeklyData(filtered);

  const rangeButtons: { id: DateRangeOption; label: string }[] = [
    { id: '7d', label: '近7天' },
    { id: '30d', label: '近30天' },
    { id: '90d', label: '近3個月' },
    { id: '180d', label: '近6個月' },
    { id: '1y', label: '近1年' },
    { id: 'all', label: '全期間' },
  ];

  const formatDateTick = (dateStr: string) => {
    if (!dateStr) return '';
    // Format "2026-06-20 07:06" to "06/20"
    const datePart = dateStr.split(' ')[0];
    const parts = datePart.split('-');
    if (parts.length >= 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return dateStr;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const extra = payload[0]?.payload;
      return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-3 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[220px]">
          <div className="font-semibold text-gray-800 dark:text-slate-200 border-b border-gray-100 dark:border-slate-700 pb-1.5 mb-1 flex items-center justify-between space-x-3">
            <span>{label}</span>
            {extra?.recordCount !== undefined && (
              <span className="text-[10px] bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded font-normal">
                本週包含 {extra.recordCount} 次量測
              </span>
            )}
          </div>
          {payload.map((entry: any, index: number) => {
            let changeText = '';
            if (entry.dataKey === 'weightAvg' && extra?.weightChangePercentVsPrevWeek !== undefined) {
              const diff = extra.weightChangeVsPrevWeek;
              const pct = extra.weightChangePercentVsPrevWeek;
              changeText = `${diff > 0 ? '+' : ''}${diff}kg (${pct > 0 ? '+' : ''}${pct}%)`;
            } else if (entry.dataKey === 'bodyFatAvg' && extra?.fatRateChangePercentVsPrevWeek !== undefined) {
              const diff = extra.fatRateChangeVsPrevWeek;
              const pct = extra.fatRateChangePercentVsPrevWeek;
              changeText = `${diff > 0 ? '+' : ''}${diff}%p (${pct > 0 ? '+' : ''}${pct}%)`;
            } else if (entry.dataKey === 'skeletalMuscleAvg' && extra?.muscleRateChangeVsPrevWeek !== undefined) {
              const diff = extra.muscleRateChangeVsPrevWeek;
              changeText = `${diff > 0 ? '+' : ''}${diff}%p`;
            }

            return (
              <div key={`item-${index}`} className="flex items-center justify-between space-x-3">
                <span className="flex items-center space-x-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  <span>{entry.name}:</span>
                </span>
                <div className="text-right">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {entry.value} {entry.unit || ''}
                  </span>
                  {changeText && (
                    <span className={`block text-[10px] font-semibold ${
                      changeText.includes('-') 
                        ? (entry.dataKey === 'skeletalMuscleAvg' ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400')
                        : (entry.dataKey === 'skeletalMuscleAvg' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')
                    }`}>
                      較前週: {changeText}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Controls & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Chart View Switcher Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 dark:bg-slate-900 rounded-xl">
          <button
            onClick={() => setChartType('main')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'main'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            日紀錄 (體重體脂)
          </button>
          <button
            onClick={() => setChartType('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'weekly'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>每週平均趨勢</span>
          </button>
          <button
            onClick={() => setChartType('balance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'balance'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            肌肉 vs 脂肪量 (kg)
          </button>
          <button
            onClick={() => setChartType('segmental')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'segmental'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            部位肌肉與脂肪率
          </button>
          <button
            onClick={() => setChartType('bmi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'bmi'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            BMI & 身體年齡
          </button>
        </div>

        {/* Date Filter Range & Options */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Date range pills */}
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-slate-900 p-1 rounded-xl border border-gray-100 dark:border-slate-800">
            <Filter className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-0.5" />
            {rangeButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRangeOption(btn.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  rangeOption === btn.id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Toggle 7D Moving Average */}
          <button
            onClick={() => setShowSma(!showSma)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              showSma
                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'
            }`}
            title="平滑顯示每日體重水份波動"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>7日移動平均線 ({showSma ? '開啟' : '關閉'})</span>
          </button>

        </div>

      </div>

      {/* Main Chart Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              {chartType === 'main' && '每日體重 (kg) 與 體脂肪率 (%) 趨勢'}
              {chartType === 'weekly' && '每週平均體重與體脂率趨勢 (週聚合法)'}
              {chartType === 'balance' && '肌肉量 (kg) vs 脂肪量 (kg) 淨重量變化'}
              {chartType === 'segmental' && '雙臂、軀幹、雙腳 部位細部變化 (Segmental)'}
              {chartType === 'bmi' && 'BMI 體質指數 與 身體年齡變化 (Years)'}
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            {chartType === 'weekly'
              ? `顯示 ${weeklyData.length} 週數據 (共包含 ${chartData.length} 次量測)`
              : `顯示 ${chartData.length} 筆資料點`}
          </span>
        </div>

        <div className="h-[380px] sm:h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            
            {chartType === 'weekly' ? (
              <ComposedChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700/60" />
                <XAxis dataKey="weekLabel" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" domain={['dataMin - 1', 'dataMax + 1']} stroke="#0284c7" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={['dataMin - 1', 'dataMax + 1']} stroke="#f59e0b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 15, fontSize: 12 }} />

                <Bar yAxisId="left" dataKey="weightAvg" name="週平均體重" unit="kg" fill="#0284c7" fillOpacity={0.15} stroke="#0284c7" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="weightAvg" name="週體重趨勢" unit="kg" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 5, fill: '#0284c7' }}>
                  <LabelList
                    content={(props: any) => {
                      const { x, y, index } = props;
                      const item = weeklyData[index];
                      if (!item || item.weightChangePercentVsPrevWeek === undefined) return null;

                      const pct = item.weightChangePercentVsPrevWeek;
                      const isDecrease = pct < 0;
                      const isZero = pct === 0;
                      const text = isZero ? '0%' : `${pct > 0 ? '+' : ''}${pct}%`;
                      const color = isDecrease ? '#047857' : isZero ? '#64748b' : '#b91c1c';
                      const bg = isDecrease ? '#dcfce7' : isZero ? '#f1f5f9' : '#fee2e2';

                      return (
                        <g transform={`translate(${x},${y - 16})`}>
                          <rect
                            x="-24"
                            y="-11"
                            width="48"
                            height="16"
                            rx="4"
                            fill={bg}
                            stroke={color}
                            strokeWidth="1"
                          />
                          <text
                            x="0"
                            y="1"
                            fill={color}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            {text}
                          </text>
                        </g>
                      );
                    }}
                  />
                </Line>
                <Line yAxisId="right" type="monotone" dataKey="bodyFatAvg" name="週平均體脂率" unit="%" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
                <Line yAxisId="right" type="monotone" dataKey="skeletalMuscleAvg" name="週平均骨骼肌率" unit="%" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
              </ComposedChart>
            ) : chartType === 'main' ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700/60" />
                <XAxis dataKey="date" tickFormatter={formatDateTick} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" domain={['dataMin - 1', 'dataMax + 1']} stroke="#0284c7" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={['dataMin - 1', 'dataMax + 1']} stroke="#f59e0b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 15, fontSize: 12 }} />

                {/* Weight Line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="weight"
                  name="體重"
                  unit="kg"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0284c7' }}
                  activeDot={{ r: 6 }}
                />

                {/* 7-day SMA Weight */}
                {showSma && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="weightSma7"
                    name="體重 7日滑動平均"
                    unit="kg"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}

                {/* Body Fat % Line */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bodyFat"
                  name="體脂肪率"
                  unit="%"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b' }}
                />

                {/* Skeletal Muscle % Line */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="skeletalMuscle"
                  name="骨骼肌率"
                  unit="%"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </ComposedChart>
            ) : chartType === 'balance' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700/60" />
                <XAxis dataKey="date" tickFormatter={formatDateTick} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 15, fontSize: 12 }} />

                <Area type="monotone" dataKey="skeletalMuscleMass" name="骨骼肌重量" unit="kg" stroke="#10b981" fillOpacity={1} fill="url(#colorMuscle)" strokeWidth={2} />
                <Area type="monotone" dataKey="fatMass" name="體脂肪重量" unit="kg" stroke="#ef4444" fillOpacity={1} fill="url(#colorFat)" strokeWidth={2} />
              </AreaChart>
            ) : chartType === 'segmental' ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700/60" />
                <XAxis dataKey="date" tickFormatter={formatDateTick} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 15, fontSize: 12 }} />

                <Line type="monotone" dataKey="skeletalMuscleArm" name="骨骼肌(雙臂)" unit="%" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="skeletalMuscleTrunk" name="骨骼肌(軀幹)" unit="%" stroke="#818cf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="skeletalMuscleLeg" name="骨骼肌(雙腳)" unit="%" stroke="#34d399" strokeWidth={2} dot={false} />
                
                <Line type="monotone" dataKey="subcutaneousFatArm" name="皮下脂肪(雙臂)" unit="%" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                <Line type="monotone" dataKey="subcutaneousFatTrunk" name="皮下脂肪(軀幹)" unit="%" stroke="#f87171" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                <Line type="monotone" dataKey="subcutaneousFatLeg" name="皮下脂肪(雙腳)" unit="%" stroke="#fb923c" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
              </ComposedChart>
            ) : (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700/60" />
                <XAxis dataKey="date" tickFormatter={formatDateTick} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" domain={['dataMin - 1', 'dataMax + 1']} stroke="#8b5cf6" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={['dataMin - 2', 'dataMax + 2']} stroke="#ec4899" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 15, fontSize: 12 }} />

                <Line yAxisId="left" type="monotone" dataKey="bmi" name="BMI" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="bodyAge" name="身體年齡" unit="歲" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            )}

          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
};
