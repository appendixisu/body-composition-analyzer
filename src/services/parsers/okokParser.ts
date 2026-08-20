import { BodyRecord, IBodyDataParser, ParseResult } from '../../types/bodyComposition';

export class OkokExcelParser implements IBodyDataParser {
  name = 'OKOK 國際版 (Xlsx)';
  id = 'okok';
  description = '支援『OKOK-國際版』App 匯出的 Excel (.xlsx / .xls) 體量測數據檔';

  canParse(headers: string[]): boolean {
    const clean = headers.map(h => h.trim().replace(/^"|"$/g, ''));
    const hasDate = clean.includes('日期') || clean.includes('Date');
    const hasWeight = clean.includes('體重(公斤)') || clean.includes('體重');
    const hasOkokKeys = clean.includes('脂肪重量(公斤)') || clean.includes('內臟脂肪率') || clean.includes('基礎代謝率(千卡/天)') || clean.includes('骨骼肌率(%)') || clean.includes('水分比例(%)');
    return hasDate && hasWeight && hasOkokKeys;
  }

  parse(rawRows: Record<string, string>[]): ParseResult {
    const records: BodyRecord[] = [];
    const errors: string[] = [];

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      try {
        const rawDate = this.getVal(row, ['日期', 'Date', '測量日期']);
        const rawTime = this.getVal(row, ['時間', 'Time']) || '08:00';
        if (!rawDate) continue;

        const dateStr = this.normalizeDateTimeStr(rawDate, rawTime);
        const timestamp = new Date(dateStr).getTime();
        if (isNaN(timestamp)) {
          errors.push(`第 ${index + 1} 行：無效的日期格式 (${rawDate} ${rawTime})`);
          continue;
        }

        const weight = this.num(this.getVal(row, ['體重(公斤)', '體重', 'Weight']));
        if (weight <= 0) continue;

        const bmi = this.num(this.getVal(row, ['BMI'])) || parseFloat((weight / (1.65 * 1.65)).toFixed(1));
        const bodyFat = this.num(this.getVal(row, ['脂肪率(%)', '脂肪率', '體脂肪(%)']));
        const fatMass = this.num(this.getVal(row, ['脂肪重量(公斤)', '脂肪重量']));
        const skeletalMuscle = this.num(this.getVal(row, ['骨骼肌率(%)', '骨骼肌率', '肌肉比例(%)']));
        const skeletalMuscleMass = this.num(this.getVal(row, ['骨骼肌重量(公斤)', '肌肉重量(公斤)', '骨骼肌重量']));
        const visceralFat = this.num(this.getVal(row, ['內臟脂肪率', '內臟脂肪程度', '內臟脂肪']));
        const bmr = this.num(this.getVal(row, ['基礎代謝率(千卡/天)', '基礎代謝率', '基礎代謝']));

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
          skeletalMuscleArm: 0,
          skeletalMuscleTrunk: 0,
          skeletalMuscleLeg: 0,
          subcutaneousFat: 0,
          subcutaneousFatArm: 0,
          subcutaneousFatTrunk: 0,
          subcutaneousFatLeg: 0,
          bmi,
          bodyAge: 0,
          deviceModel: 'OKOK-國際版',
          sourceFormat: 'okok'
        });
      } catch (err: any) {
        errors.push(`第 ${index + 1} 行解析失敗: ${err?.message || '未知錯誤'}`);
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

  private getVal(row: Record<string, string>, keys: string[]): string {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
      const match = rowKeys.find(k => k.trim().replace(/^"|"$/g, '') === key);
      if (match && row[match] !== undefined && row[match] !== null) {
        return String(row[match]).trim().replace(/^"|"$/g, '');
      }
    }
    return '';
  }

  private num(val: string): number {
    if (!val) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }

  private normalizeDateTimeStr(dateStr: string, timeStr: string): string {
    const cleanDate = dateStr.replace(/\//g, '-').trim();
    const cleanTime = timeStr.trim();

    const [y, m, d] = cleanDate.split('-');
    const mm = (m || '01').padStart(2, '0');
    const dd = (d || '01').padStart(2, '0');

    const [h, min] = cleanTime.split(':');
    const hh = (h || '08').padStart(2, '0');
    const minmin = (min || '00').padStart(2, '0');

    return `${y}-${mm}-${dd} ${hh}:${minmin}`;
  }
}
