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

  return result.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
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

  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const latest = sorted[sorted.length - 1];

  let baseline = sorted[0];
  let periodLabel = '全期間累積';

  if (period === '7d') {
    const ts7d = latest.timestamp - 7 * 24 * 60 * 60 * 1000;
    baseline = findClosestRecordBefore(sorted, ts7d) || sorted[0];
    periodLabel = '近 7 日';
  } else if (period === '30d') {
    const ts30d = latest.timestamp - 30 * 24 * 60 * 60 * 1000;
    baseline = findClosestRecordBefore(sorted, ts30d) || sorted[0];
    periodLabel = '近 30 日';
  }

  const weightChangeKg = parseFloat((latest.weight - baseline.weight).toFixed(2));
  
  const latestFatKg = latest.fatMass || (latest.weight * latest.bodyFat) / 100;
  const baseFatKg = baseline.fatMass || (baseline.weight * baseline.bodyFat) / 100;
  const fatMassChangeKg = parseFloat((latestFatKg - baseFatKg).toFixed(2));

  const latestMuscleKg = latest.skeletalMuscleMass || (latest.weight * latest.skeletalMuscle) / 100;
  const baseMuscleKg = baseline.skeletalMuscleMass || (baseline.weight * baseline.skeletalMuscle) / 100;
  const muscleMassChangeKg = parseFloat((latestMuscleKg - baseMuscleKg).toFixed(2));

  const isWeightDecreased = weightChangeKg < -0.2; // 減重超過 0.2kg

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
      statusLabel: weightChangeKg > 0.2 ? '體重增加 / 增肌增脂期' : '體重持平維持期',
      statusBadgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
      advice: '目前體重未呈現明顯下降。若目標為增肌，請持續觀察肌肉重量變化；若目標為減脂，建議檢視每日熱量攝取。'
    };
  }

  const weightLost = Math.abs(weightChangeKg); // 減掉的總公斤數 (正數)
  const fatLost = fatMassChangeKg < 0 ? Math.abs(fatMassChangeKg) : 0; // 減掉的脂肪公斤數
  const muscleLost = muscleMassChangeKg < 0 ? Math.abs(muscleMassChangeKg) : 0; // 減掉的肌肉公斤數

  const fatLossPercentage = Math.min(100, Math.max(0, Math.round((fatLost / weightLost) * 100)));
  const muscleLossPercentage = Math.min(100, Math.max(0, Math.round((muscleLost / weightLost) * 100)));

  // 評估減重品質
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
      statusLabel: '優質健康減脂 (肌肉留存良好)',
      statusBadgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      advice: `極佳！在減掉的 ${weightLost.toFixed(1)} kg 體重中，有 ${fatLossPercentage}% 為脂肪量。肌肉維持非常理想，能有效防止基礎代謝率下滑！`
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
      statusLabel: '平穩減重 (微幅肌肉流失)',
      statusBadgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      advice: `減重進度穩定，但減去的重量中有 ${muscleLossPercentage}% (${muscleLost.toFixed(1)} kg) 來自骨骼肌。建議適當提高蛋白質攝取並增加阻力訓練。`
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
      statusLabel: '警告：肌肉過度流失！(肌少/代謝下降風險)',
      statusBadgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
      advice: `警告！在減掉的 ${weightLost.toFixed(1)} kg 體重中，肌肉流失高達 ${muscleLossPercentage}% (${muscleLost.toFixed(1)} kg)！這會導致基礎代謝顯著下滑與復胖風險。請切勿極端節食，並務必大幅增加蛋白質攝取與重量訓練。`
    };
  }
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
