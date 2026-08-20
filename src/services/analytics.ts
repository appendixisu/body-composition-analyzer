import { BodyRecord, DateFilter, MetricSummary, BmiCategory, BodyFatCategory } from '../types/bodyComposition';

export function filterRecordsByDateRange(records: BodyRecord[], filter: DateFilter): BodyRecord[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);

  if (filter.range === 'all') return sorted;

  const latestRecord = sorted[sorted.length - 1];
  const latestTimestamp = latestRecord ? latestRecord.timestamp : Date.now();

  let days = 0;
  switch (filter.range) {
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    case '90d': days = 90; break;
    case '180d': days = 180; break;
    case '1y': days = 365; break;
    case 'custom':
      if (filter.startDate && filter.endDate) {
        const startTs = new Date(filter.startDate).getTime();
        const endTs = new Date(`${filter.endDate} 23:59:59`).getTime();
        return sorted.filter(r => r.timestamp >= startTs && r.timestamp <= endTs);
      }
      return sorted;
    default:
      return sorted;
  }

  const cutoffTs = latestTimestamp - days * 24 * 60 * 60 * 1000;
  return sorted.filter(r => r.timestamp >= cutoffTs);
}

export interface ChartDataPoint extends BodyRecord {
  weightSma7?: number;
  bodyFatSma7?: number;
  skeletalMuscleSma7?: number;
}

export interface WeeklyAggregatePoint {
  weekKey: string;
  weekLabel: string;
  startDateStr: string;
  weightAvg: number;
  bodyFatAvg: number;
  skeletalMuscleAvg: number;
  fatMassAvg: number;
  skeletalMuscleMassAvg: number;
  bmiAvg: number;
  bodyAgeAvg: number;
  recordCount: number;

  // 相較前一週相差數值與百分比 (Week over Week)
  weightChangeVsPrevWeek?: number;        // 體重公斤差 (kg), e.g. -1.2
  weightChangePercentVsPrevWeek?: number; // 體重百分比差 (%), e.g. -2.04%
  fatRateChangeVsPrevWeek?: number;       // 體脂率百分點差 (%), e.g. -0.5%
  fatRateChangePercentVsPrevWeek?: number;// 體脂率相對百分比差 (%), e.g. -1.8%
  muscleRateChangeVsPrevWeek?: number;    // 骨骼肌率百分點差 (%), e.g. +0.3%
}

export function prepareWeeklyData(records: BodyRecord[]): WeeklyAggregatePoint[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);

  // Group by Monday of each week
  const map = new Map<string, BodyRecord[]>();

  for (const record of sorted) {
    const dt = new Date(record.timestamp);
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(dt.setDate(diff));
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const date = String(monday.getDate()).padStart(2, '0');
    const weekKey = `${year}-${month}-${date}`;

    if (!map.has(weekKey)) {
      map.set(weekKey, []);
    }
    map.get(weekKey)!.push(record);
  }

  const result: WeeklyAggregatePoint[] = [];

  map.forEach((groupRecords, weekKey) => {
    const count = groupRecords.length;
    const [y, m, d] = weekKey.split('-');
    
    // Sunday date
    const monDt = new Date(Number(y), Number(m) - 1, Number(d));
    const sunDt = new Date(monDt);
    sunDt.setDate(sunDt.getDate() + 6);
    const sunM = String(sunDt.getMonth() + 1).padStart(2, '0');
    const sunD = String(sunDt.getDate()).padStart(2, '0');

    const weekLabel = `${m}/${d}~${sunM}/${sunD}`;

    const weightSum = groupRecords.reduce((acc, r) => acc + r.weight, 0);
    const fatSum = groupRecords.reduce((acc, r) => acc + r.bodyFat, 0);
    const muscleSum = groupRecords.reduce((acc, r) => acc + r.skeletalMuscle, 0);
    const fatMassSum = groupRecords.reduce((acc, r) => acc + (r.fatMass || (r.weight * r.bodyFat) / 100), 0);
    const muscleMassSum = groupRecords.reduce((acc, r) => acc + (r.skeletalMuscleMass || (r.weight * r.skeletalMuscle) / 100), 0);
    const bmiSum = groupRecords.reduce((acc, r) => acc + r.bmi, 0);
    const ageSum = groupRecords.reduce((acc, r) => acc + r.bodyAge, 0);

    result.push({
      weekKey,
      weekLabel,
      startDateStr: weekKey,
      weightAvg: parseFloat((weightSum / count).toFixed(2)),
      bodyFatAvg: parseFloat((fatSum / count).toFixed(1)),
      skeletalMuscleAvg: parseFloat((muscleSum / count).toFixed(1)),
      fatMassAvg: parseFloat((fatMassSum / count).toFixed(1)),
      skeletalMuscleMassAvg: parseFloat((muscleMassSum / count).toFixed(1)),
      bmiAvg: parseFloat((bmiSum / count).toFixed(1)),
      bodyAgeAvg: Math.round(ageSum / count),
      recordCount: count,
    });
  });

  const sortedResult = result.sort((a, b) => a.weekKey.localeCompare(b.weekKey));

  // 計算週與週之間 (WoW) 的公斤差與百分比比率
  for (let i = 0; i < sortedResult.length; i++) {
    const curr = sortedResult[i];
    if (i > 0) {
      const prev = sortedResult[i - 1];

      const wDiff = parseFloat((curr.weightAvg - prev.weightAvg).toFixed(2));
      const wPct = prev.weightAvg > 0 ? parseFloat(((wDiff / prev.weightAvg) * 100).toFixed(2)) : 0;

      const fDiff = parseFloat((curr.bodyFatAvg - prev.bodyFatAvg).toFixed(1));
      const fPct = prev.bodyFatAvg > 0 ? parseFloat(((fDiff / prev.bodyFatAvg) * 100).toFixed(2)) : 0;

      const mDiff = parseFloat((curr.skeletalMuscleAvg - prev.skeletalMuscleAvg).toFixed(1));

      curr.weightChangeVsPrevWeek = wDiff;
      curr.weightChangePercentVsPrevWeek = wPct;
      curr.fatRateChangeVsPrevWeek = fDiff;
      curr.fatRateChangePercentVsPrevWeek = fPct;
      curr.muscleRateChangeVsPrevWeek = mDiff;
    }
  }

  return sortedResult;
}

export function prepareChartData(records: BodyRecord[]): ChartDataPoint[] {
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  
  return sorted.map((record, idx) => {
    // 7-day Simple Moving Average (SMA)
    const windowStart = Math.max(0, idx - 6);
    const windowRecords = sorted.slice(windowStart, idx + 1);

    const weightSum = windowRecords.reduce((acc, r) => acc + r.weight, 0);
    const weightSma7 = parseFloat((weightSum / windowRecords.length).toFixed(2));

    const fatSum = windowRecords.reduce((acc, r) => acc + r.bodyFat, 0);
    const bodyFatSma7 = fatSum > 0 ? parseFloat((fatSum / windowRecords.length).toFixed(1)) : undefined;

    const muscleSum = windowRecords.reduce((acc, r) => acc + r.skeletalMuscle, 0);
    const skeletalMuscleSma7 = muscleSum > 0 ? parseFloat((muscleSum / windowRecords.length).toFixed(1)) : undefined;

    return {
      ...record,
      weightSma7,
      bodyFatSma7,
      skeletalMuscleSma7,
    };
  });
}

export function calculateSummary(records: BodyRecord[], field: keyof BodyRecord): MetricSummary | null {
  if (!records || records.length === 0) return null;
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  
  const currentRecord = sorted[sorted.length - 1];
  const currentVal = Number(currentRecord[field]) || 0;

  const nowTs = currentRecord.timestamp;
  const ts7d = nowTs - 7 * 24 * 60 * 60 * 1000;
  const ts30d = nowTs - 30 * 24 * 60 * 60 * 1000;

  // Find closest record to 7d ago and 30d ago
  const record7d = findClosestRecordBefore(sorted, ts7d);
  const record30d = findClosestRecordBefore(sorted, ts30d);
  const firstRecord = sorted[0];

  const val7d = record7d ? Number(record7d[field]) || 0 : undefined;
  const val30d = record30d ? Number(record30d[field]) || 0 : undefined;
  const valFirst = Number(firstRecord[field]) || 0;

  const numericValues = sorted.map(r => Number(r[field]) || 0).filter(v => v > 0);
  const min = numericValues.length > 0 ? Math.min(...numericValues) : currentVal;
  const max = numericValues.length > 0 ? Math.max(...numericValues) : currentVal;
  const avg = numericValues.length > 0 ? parseFloat((numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2)) : currentVal;

  return {
    current: currentVal,
    previous: sorted.length > 1 ? Number(sorted[sorted.length - 2][field]) || undefined : undefined,
    change7d: val7d !== undefined ? parseFloat((currentVal - val7d).toFixed(2)) : undefined,
    change30d: val30d !== undefined ? parseFloat((currentVal - val30d).toFixed(2)) : undefined,
    changeTotal: parseFloat((currentVal - valFirst).toFixed(2)),
    min,
    max,
    avg,
  };
}

function findClosestRecordBefore(sortedRecords: BodyRecord[], targetTs: number): BodyRecord | undefined {
  const eligible = sortedRecords.filter(r => r.timestamp <= targetTs);
  if (eligible.length > 0) return eligible[eligible.length - 1];
  return sortedRecords[0];
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return { category: '偏輕', color: '#0ea5e9', badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' };
  } else if (bmi < 24.0) {
    return { category: '正常', color: '#10b981', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' };
  } else if (bmi < 27.0) {
    return { category: '過重', color: '#f59e0b', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' };
  } else if (bmi < 30.0) {
    return { category: '輕度肥胖', color: '#f97316', badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' };
  } else if (bmi < 35.0) {
    return { category: '中度肥胖', color: '#ef4444', badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' };
  } else {
    return { category: '重度肥胖', color: '#991b1b', badgeClass: 'bg-rose-900 text-white dark:bg-rose-950 dark:text-rose-200' };
  }
}

export function getBodyFatCategory(bodyFat: number): BodyFatCategory {
  if (bodyFat < 10) {
    return { category: '偏低', color: '#38bdf8' };
  } else if (bodyFat <= 20) {
    return { category: '標準', color: '#10b981' };
  } else if (bodyFat <= 25) {
    return { category: '偏高', color: '#f59e0b' };
  } else {
    return { category: '過高', color: '#ef4444' };
  }
}

export interface VisceralFatCategory {
  category: '標準 (1-9)' | '偏高 (10-14)' | '過高 (15+)';
  color: string;
}

export interface WeightLossQuality {
  periodLabel: string;
  weightChangeKg: number;      // 體重總變化量 (kg)
  fatMassChangeKg: number;     // 脂肪重量變化量 (kg)
  muscleMassChangeKg: number;  // 骨骼肌重量變化量 (kg)
  fatLossPercentage: number;   // 減脂佔減重比例 (%)
  muscleLossPercentage: number;// 減肌佔減重比例 (%)
  isWeightDecreased: boolean;  // 是否為減重狀態
  qualityRating: 'excellent' | 'moderate' | 'warning' | 'gaining';
  statusLabel: string;
  statusBadgeClass: string;
  advice: string;
}

export function calculateWeightLossQuality(
  records: BodyRecord[],
  period: '7d' | '30d' | 'total' = 'total'
): WeightLossQuality | null {
  if (!records || records.length < 2) return null;

  // 使用週平均數據
  const weeklyData = prepareWeeklyData(records);
  if (!weeklyData || weeklyData.length === 0) return null;

  const latestWeek = weeklyData[weeklyData.length - 1];
  let baselineWeek = weeklyData[0];
  let periodLabel = '全期間累積 (週平均)';

  if (period === '7d') {
    // 與前一週比較
    baselineWeek = weeklyData.length >= 2 ? weeklyData[weeklyData.length - 2] : weeklyData[0];
    periodLabel = '近 1 週 (與前週相比)';
  } else if (period === '30d') {
    // 與約 4 週前比較
    const targetIdx = Math.max(0, weeklyData.length - 5);
    baselineWeek = weeklyData[targetIdx];
    periodLabel = '近 4 週 (與一月前相比)';
  }

  // 基於週平均計算變化量
  const weightChangeKg = parseFloat((latestWeek.weightAvg - baselineWeek.weightAvg).toFixed(2));
  const fatMassChangeKg = parseFloat((latestWeek.fatMassAvg - baselineWeek.fatMassAvg).toFixed(2));
  const muscleMassChangeKg = parseFloat((latestWeek.skeletalMuscleMassAvg - baselineWeek.skeletalMuscleMassAvg).toFixed(2));

  const isWeightDecreased = weightChangeKg < -0.1; // 週平均體重下降超過 0.1kg

  if (!isWeightDecreased) {
    return {
      periodLabel,
      weightChangeKg,
      fatMassChangeKg,
      muscleMassChangeKg,
      fatLossPercentage: 0,
      muscleLossPercentage: 0,
      isWeightDecreased: false,
      qualityRating: 'gaining',
      statusLabel: weightChangeKg > 0.1 ? '週平均體重增加 (增重/增肌期)' : '週平均體重持平維持',
      statusBadgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
      advice: `週平均體重未呈現明顯下滑 (${baselineWeek.weekLabel} 週均 ${baselineWeek.weightAvg}kg ➜ ${latestWeek.weekLabel} 週均 ${latestWeek.weightAvg}kg)。若目標為增肌，請關注肌肉量變化；若目標為減脂，請檢視每日熱量。`
    };
  }

  const weightLost = Math.abs(weightChangeKg); // 減掉的週平均公斤數
  const fatLost = fatMassChangeKg < 0 ? Math.abs(fatMassChangeKg) : 0;
  const muscleLost = muscleMassChangeKg < 0 ? Math.abs(muscleMassChangeKg) : 0;

  const fatLossPercentage = Math.min(100, Math.max(0, Math.round((fatLost / weightLost) * 100)));
  const muscleLossPercentage = Math.min(100, Math.max(0, Math.round((muscleLost / weightLost) * 100)));

  // 評估週平均減重品質
  if (muscleMassChangeKg >= 0 || muscleLossPercentage <= 20 || fatLossPercentage >= 70) {
    return {
      periodLabel,
      weightChangeKg,
      fatMassChangeKg,
      muscleMassChangeKg,
      fatLossPercentage,
      muscleLossPercentage,
      isWeightDecreased: true,
      qualityRating: 'excellent',
      statusLabel: '週平均：優質健康減脂 (肌肉留存良好)',
      statusBadgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      advice: `週平均分析極佳！在週平均減掉的 ${weightLost.toFixed(1)} kg 體重中，有 ${fatLossPercentage}% 為脂肪減少 (${fatLost.toFixed(1)} kg)。肌肉量平穩留存，能有效防止基礎代謝率下滑！`
    };
  } else if (fatLossPercentage >= 50 && muscleLossPercentage <= 50) {
    return {
      periodLabel,
      weightChangeKg,
      fatMassChangeKg,
      muscleMassChangeKg,
      fatLossPercentage,
      muscleLossPercentage,
      isWeightDecreased: true,
      qualityRating: 'moderate',
      statusLabel: '週平均：平穩減重 (微幅肌肉流失)',
      statusBadgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      advice: `週平均減重進度穩定，但週平均減去的重量中有 ${muscleLossPercentage}% (${muscleLost.toFixed(1)} kg) 來自骨骼肌流失。建議適當提高蛋白質攝取與重量訓練。`
    };
  } else {
    return {
      periodLabel,
      weightChangeKg,
      fatMassChangeKg,
      muscleMassChangeKg,
      fatLossPercentage,
      muscleLossPercentage,
      isWeightDecreased: true,
      qualityRating: 'warning',
      statusLabel: '週平均警告：肌肉流失過多！(肌少/代謝下降風險)',
      statusBadgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
      advice: `週平均分析警告！在週平均減掉的 ${weightLost.toFixed(1)} kg 體重中，肌肉流失佔比高達 ${muscleLossPercentage}% (${muscleLost.toFixed(1)} kg)！這會導致基礎代謝顯著下滑。請避免極端節食，並補充蛋白質與重量訓練。`
    };
  }
}

export interface WeightVelocityAnalysis {
  weeklyRateKg: number;
  monthlyRateKg: number;
  statusRating: 'too_fast_loss' | 'healthy_loss' | 'mild_loss' | 'maintain' | 'healthy_gain' | 'too_fast_gain';
  statusLabel: string;
  statusBadgeClass: string;
  advice: string;
  ratePerWeekText: string;
}

export function calculateWeightVelocity(records: BodyRecord[]): WeightVelocityAnalysis | null {
  if (!records || records.length < 2) return null;
  const weeklyData = prepareWeeklyData(records);
  if (!weeklyData || weeklyData.length < 2) return null;

  const latest = weeklyData[weeklyData.length - 1];
  const prev = weeklyData[weeklyData.length - 2];

  // 計算近週每週變化速度 (kg/週)
  const weeklyRateKg = parseFloat((latest.weightAvg - prev.weightAvg).toFixed(2));
  const monthlyRateKg = parseFloat((weeklyRateKg * 4.33).toFixed(1));

  let statusRating: WeightVelocityAnalysis['statusRating'] = 'maintain';
  let statusLabel = '體重平穩維持 (±0.2 kg/週)';
  let statusBadgeClass = 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300';
  let advice = '目前週平均體重相當平穩，適合維持期或奠定生理代謝基礎。';

  if (weeklyRateKg < -1.0) {
    statusRating = 'too_fast_loss';
    statusLabel = '⚠️ 瘦太快警示！(每週減 > 1.0 kg)';
    statusBadgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 animate-pulse';
    advice = `警示！您目前每週平均減重速度高達 ${Math.abs(weeklyRateKg)} kg/週 (約每月減 ${Math.abs(monthlyRateKg)} kg)。瘦太快極易導致肌肉劇烈流失、膽結石風險與基礎代謝急速下降，建議適度提升每日熱量與蛋白質攝取！`;
  } else if (weeklyRateKg <= -0.5) {
    statusRating = 'healthy_loss';
    statusLabel = '✨ 黃金減重速度 (-0.5 ~ -1.0 kg/週)';
    statusBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    advice = `太棒了！您目前的每週減重速度為 ${Math.abs(weeklyRateKg)} kg/週，屬於醫學推薦的黃金健康減脂速率。在有效燃燒脂肪的同時能最大化保留肌肉！`;
  } else if (weeklyRateKg < -0.2) {
    statusRating = 'mild_loss';
    statusLabel = '🌱 溫和徐緩減重 (-0.2 ~ -0.5 kg/週)';
    statusBadgeClass = 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300';
    advice = `進度良好！每週平均減少 ${Math.abs(weeklyRateKg)} kg，速度溫和且極具永續性，不易復胖且生活壓力小。`;
  } else if (weeklyRateKg <= 0.2) {
    statusRating = 'maintain';
    statusLabel = '⚖️ 體重平穩維持 (±0.2 kg/週)';
    statusBadgeClass = 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300';
    advice = `體重呈平穩維持狀態 (${weeklyRateKg > 0 ? '+' : ''}${weeklyRateKg} kg/週)。適合代謝休養期或維持體態。`;
  } else if (weeklyRateKg <= 0.5) {
    statusRating = 'healthy_gain';
    statusLabel = '💪 穩定健康增重/增肌 (+0.2 ~ +0.5 kg/週)';
    statusBadgeClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300';
    advice = `增重速度控制理想 (+${weeklyRateKg} kg/週)！若配合充足阻力訓練，此速度能幫助肌肉增長同時控制體脂。`;
  } else {
    statusRating = 'too_fast_gain';
    statusLabel = '⚠️ 胖太快 / 增重過快警示！(每週增 > 0.5 kg)';
    statusBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    advice = `警示！目前每週體重增加速度達 +${weeklyRateKg} kg/週 (約每月增 +${monthlyRateKg} kg)。增重速度過快可能導致體脂肪迅速堆積，建議適當控制熱量盈餘。`;
  }

  return {
    weeklyRateKg,
    monthlyRateKg,
    statusRating,
    statusLabel,
    statusBadgeClass,
    advice,
    ratePerWeekText: `${weeklyRateKg > 0 ? '+' : ''}${weeklyRateKg} kg / 週`
  };
}

export function getVisceralFatCategory(visceralFat: number): VisceralFatCategory {
  if (visceralFat <= 9) {
    return { category: '標準 (1-9)', color: '#10b981' };
  } else if (visceralFat <= 14) {
    return { category: '偏高 (10-14)', color: '#f59e0b' };
  } else {
    return { category: '過高 (15+)', color: '#ef4444' };
  }
}
