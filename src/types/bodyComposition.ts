export interface BodyRecord {
  id?: number;
  date: string;              // YYYY-MM-DD HH:mm format
  timestamp: number;         // Unix timestamp in ms
  timezone: string;          // e.g. "Asia/Taipei"
  weight: number;            // 體重(kg)
  bodyFat: number;           // 體脂肪(%)
  fatMass: number;           // 體脂肪量(kg)
  visceralFat: number;       // 內臟脂肪程度
  bmr: number;               // 基礎代謝(kcal)
  skeletalMuscle: number;    // 骨骼肌(%)
  skeletalMuscleMass: number;// 骨骼肌重量(kg)
  skeletalMuscleArm: number; // 骨骼肌率（雙臂）(%)
  skeletalMuscleTrunk: number;// 骨骼肌率（身軀）(%)
  skeletalMuscleLeg: number; // 骨骼肌率（雙腳）(%)
  subcutaneousFat: number;   // 皮下脂肪率(%)
  subcutaneousFatArm: number;// 皮下脂肪率（雙臂）(%)
  subcutaneousFatTrunk: number;// 皮下脂肪率（身軀）(%)
  subcutaneousFatLeg: number;// 皮下脂肪率（雙腳）(%)
  bmi: number;               // BMI
  bodyAge: number;           // 身體年齡(歲)
  deviceModel: string;       // 型號 (e.g. HBF-702T)
  sourceFormat?: string;     // 數據來源格式 (e.g. 'omron', 'manual', 'other')
  notes?: string;            // 備註訊息
}

export type DateRangeOption = '7d' | '30d' | '90d' | '180d' | '1y' | 'all' | 'custom';

export interface DateFilter {
  range: DateRangeOption;
  startDate?: string;
  endDate?: string;
}

export interface MetricSummary {
  current: number;
  previous?: number;
  change7d?: number;
  change30d?: number;
  changeTotal?: number;
  min?: number;
  max?: number;
  avg?: number;
}

export interface BmiCategory {
  category: '偏輕' | '正常' | '過重' | '輕度肥胖' | '中度肥胖' | '重度肥胖';
  color: string;
  badgeClass: string;
}

export interface BodyFatCategory {
  category: '偏低' | '標準' | '偏高' | '過高';
  color: string;
}

export interface VisceralFatCategory {
  category: '標準 (1-9)' | '偏高 (10-14)' | '過高 (15+)';
  color: string;
}

// 多格式解析器介面
export interface ParseResult {
  success: boolean;
  formatName: string;
  records: BodyRecord[];
  errors: string[];
  totalRows: number;
}

export interface IBodyDataParser {
  name: string;
  id: string;
  description: string;
  canParse(headers: string[], firstRow?: Record<string, string>): boolean;
  parse(rawRows: Record<string, string>[]): ParseResult;
}
