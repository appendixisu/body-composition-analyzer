import { BodyRecord, IBodyDataParser, ParseResult } from '../../types/bodyComposition';

export class GenericCsvParser implements IBodyDataParser {
  name = '自訂體重 CSV 格式';
  id = 'generic';
  description = '支援欄位 (如 Date/日期, Weight/體重, BodyFat/體脂率, BMI 等) 的 CSV 檔';

  canParse(headers: string[]): boolean {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim().replace(/^"|"$/g, ''));
    const hasDate = lowerHeaders.some(h => h.includes('date') || h.includes('日期') || h.includes('時間') || h.includes('time'));
    const hasWeight = lowerHeaders.some(h => h.includes('weight') || h.includes('體重') || h.includes('kg'));
    return hasDate && hasWeight;
  }

  parse(rawRows: Record<string, string>[]): ParseResult {
    const records: BodyRecord[] = [];
    const errors: string[] = [];

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      try {
        const rawDate = this.findField(row, ['date', '日期', '時間', 'time', '測量日期']);
        if (!rawDate) continue;

        const dateStr = this.normalizeDateStr(rawDate);
        const timestamp = new Date(dateStr).getTime();
        if (isNaN(timestamp)) continue;

        const weight = this.num(this.findField(row, ['weight', '體重', '體重(kg)', 'weight(kg)']));
        if (weight <= 0) continue;

        const bodyFat = this.num(this.findField(row, ['bodyfat', 'body_fat', '體脂肪', '體脂', '體脂肪(%)', 'fat']));
        const fatMass = this.num(this.findField(row, ['fatmass', 'fat_mass', '體脂肪量', '體脂量']));
        const visceralFat = this.num(this.findField(row, ['visceralfat', 'visceral_fat', '內臟脂肪', '內臟脂肪程度']));
        const bmr = this.num(this.findField(row, ['bmr', '基礎代謝', '基礎代謝(kcal)']));
        const skeletalMuscle = this.num(this.findField(row, ['skeletalmuscle', 'muscle', '骨骼肌', '骨骼肌(%)', '肌肉率']));
        const skeletalMuscleMass = this.num(this.findField(row, ['musclemass', '骨骼肌重量', '骨骼肌量']));
        
        const bmi = this.num(this.findField(row, ['bmi', '體質指數'])) || parseFloat((weight / ((1.75) * 1.75)).toFixed(1));
        const bodyAge = this.num(this.findField(row, ['bodyage', 'body_age', '身體年齡']));
        const deviceModel = this.findField(row, ['model', '型號', 'device']) || '通用匯入檔';

        records.push({
          date: dateStr,
          timestamp,
          timezone: 'Asia/Taipei',
          weight,
          bodyFat,
          fatMass: fatMass || (bodyFat > 0 ? parseFloat(((weight * bodyFat) / 100).toFixed(1)) : 0),
          visceralFat,
          bmr,
          skeletalMuscle,
          skeletalMuscleMass: skeletalMuscleMass || (skeletalMuscle > 0 ? parseFloat(((weight * skeletalMuscle) / 100).toFixed(1)) : 0),
          skeletalMuscleArm: this.num(this.findField(row, ['arm_muscle', '骨骼肌率（雙臂）(%)'])),
          skeletalMuscleTrunk: this.num(this.findField(row, ['trunk_muscle', '骨骼肌率（身軀）(%)'])),
          skeletalMuscleLeg: this.num(this.findField(row, ['leg_muscle', '骨骼肌率（雙腳）(%)'])),
          subcutaneousFat: this.num(this.findField(row, ['subcutaneous_fat', '皮下脂肪率(%)'])),
          subcutaneousFatArm: this.num(this.findField(row, ['arm_fat', '皮下脂肪率（雙臂）(%)'])),
          subcutaneousFatTrunk: this.num(this.findField(row, ['trunk_fat', '皮下脂肪率（身軀）(%)'])),
          subcutaneousFatLeg: this.num(this.findField(row, ['leg_fat', '皮下脂肪率（雙腳）(%)'])),
          bmi,
          bodyAge,
          deviceModel,
          sourceFormat: 'generic'
        });
      } catch (err: any) {
        errors.push(`第 ${index + 2} 行解析失敗: ${err?.message || '格式不符合'}`);
      }
    }

    return {
      success: records.length > 0,
      formatName: this.name,
      records,
      errors,
      totalRows: rawRows.length
    };
  }

  private findField(row: Record<string, string>, aliases: string[]): string {
    const keys = Object.keys(row);
    for (const alias of aliases) {
      const target = alias.toLowerCase();
      const matchKey = keys.find(k => k.toLowerCase().trim().replace(/^"|"$/g, '') === target || k.toLowerCase().includes(target));
      if (matchKey && row[matchKey]) {
        return String(row[matchKey]).trim().replace(/^"|"$/g, '');
      }
    }
    return '';
  }

  private num(val: string): number {
    if (!val) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }

  private normalizeDateStr(dateStr: string): string {
    const clean = dateStr.replace(/\//g, '-');
    if (!clean.includes(':')) {
      return `${clean} 08:00`;
    }
    return clean;
  }
}
