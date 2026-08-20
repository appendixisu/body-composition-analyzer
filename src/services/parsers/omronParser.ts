import { BodyRecord, IBodyDataParser, ParseResult } from '../../types/bodyComposition';

export class OmronCsvParser implements IBodyDataParser {
  name = 'Omron Connect (.csv)';
  id = 'omron';
  description = '支援 Omron Connect App 導出的體組成 CSV 資料檔 (包含雙臂、軀幹、雙腳細部數據)';

  canParse(headers: string[]): boolean {
    const cleanHeaders = headers.map(h => h.trim().replace(/^"|"$/g, ''));
    // 檢查關鍵歐姆龍特徵欄位
    const keyFields = ['測量日期', '體重(kg)', '體脂肪(%)', '骨骼肌(%)'];
    return keyFields.every(field => cleanHeaders.includes(field));
  }

  parse(rawRows: Record<string, string>[]): ParseResult {
    const records: BodyRecord[] = [];
    const errors: string[] = [];

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      try {
        const rawDate = this.getVal(row, ['測量日期', '日期', 'Date']);
        if (!rawDate) continue; // 跳過空行

        const dateStr = this.normalizeDateStr(rawDate);
        const timestamp = new Date(dateStr).getTime();

        if (isNaN(timestamp)) {
          errors.push(`第 ${index + 2} 行：無效的日期格式 (${rawDate})`);
          continue;
        }

        const weight = this.num(this.getVal(row, ['體重(kg)', '體重']));
        if (weight <= 0) {
          errors.push(`第 ${index + 2} 行：體重數值異常 (${weight})`);
          continue;
        }

        const bodyFat = this.num(this.getVal(row, ['體脂肪(%)', '體脂肪率(%)', '體脂']));
        const fatMass = this.num(this.getVal(row, ['體脂肪量(kg)', '體脂量']));
        const visceralFat = this.num(this.getVal(row, ['內臟脂肪程度', '內臟脂肪']));
        const bmr = this.num(this.getVal(row, ['基礎代謝(kcal)', '基礎代謝']));
        const skeletalMuscle = this.num(this.getVal(row, ['骨骼肌(%)', '骨骼肌率(%)']));
        const skeletalMuscleMass = this.num(this.getVal(row, ['骨骼肌重量(kg)', '骨骼肌量']));
        
        const skeletalMuscleArm = this.num(this.getVal(row, ['骨骼肌率（雙臂）(%)', '骨骼肌率(雙臂)(%)']));
        const skeletalMuscleTrunk = this.num(this.getVal(row, ['骨骼肌率（身軀）(%)', '骨骼肌率(身軀)(%)']));
        const skeletalMuscleLeg = this.num(this.getVal(row, ['骨骼肌率（雙腳）(%)', '骨骼肌率(雙腳)(%)']));

        const subcutaneousFat = this.num(this.getVal(row, ['皮下脂肪率(%)']));
        const subcutaneousFatArm = this.num(this.getVal(row, ['皮下脂肪率（雙臂）(%)', '皮下脂肪率(雙臂)(%)']));
        const subcutaneousFatTrunk = this.num(this.getVal(row, ['皮下脂肪率（身軀）(%)', '皮下脂肪率(身軀)(%)']));
        const subcutaneousFatLeg = this.num(this.getVal(row, ['皮下脂肪率（雙腳）(%)', '皮下脂肪率(雙腳)(%)']));

        const bmi = this.num(this.getVal(row, ['BMI']));
        const bodyAge = this.num(this.getVal(row, ['身體年齡(歲)', '身體年齡']));
        const timezone = this.getVal(row, ['時區']) || 'Asia/Taipei';
        const deviceModel = this.getVal(row, ['型號']) || 'HBF-702T';

        records.push({
          date: dateStr,
          timestamp,
          timezone,
          weight,
          bodyFat,
          fatMass: fatMass || parseFloat(((weight * bodyFat) / 100).toFixed(1)),
          visceralFat,
          bmr,
          skeletalMuscle,
          skeletalMuscleMass: skeletalMuscleMass || parseFloat(((weight * skeletalMuscle) / 100).toFixed(1)),
          skeletalMuscleArm,
          skeletalMuscleTrunk,
          skeletalMuscleLeg,
          subcutaneousFat,
          subcutaneousFatArm,
          subcutaneousFatTrunk,
          subcutaneousFatLeg,
          bmi,
          bodyAge,
          deviceModel,
          sourceFormat: 'omron'
        });
      } catch (err: any) {
        errors.push(`第 ${index + 2} 行解析失敗: ${err?.message || '未知錯誤'}`);
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
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return String(row[key]).trim().replace(/^"|"$/g, '');
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
    // 轉換 2026/06/20 07:06 或 2026/6/20 7:6 為 2026-06-20 07:06
    const clean = dateStr.replace(/\//g, '-');
    const parts = clean.split(' ');
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      const [y, m, d] = datePart.split('-');
      const [h, min] = timePart.split(':');
      const mm = m.padStart(2, '0');
      const dd = d.padStart(2, '0');
      const hh = h.padStart(2, '0');
      const minmin = (min || '00').padStart(2, '0');
      return `${y}-${mm}-${dd} ${hh}:${minmin}`;
    }
    return clean;
  }
}
