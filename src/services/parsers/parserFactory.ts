import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { BodyRecord, IBodyDataParser, ParseResult } from '../../types/bodyComposition';
import { OmronCsvParser } from './omronParser';
import { OkokExcelParser } from './okokParser';
import { GenericCsvParser } from './genericParser';

const availableParsers: IBodyDataParser[] = [
  new OmronCsvParser(),
  new OkokExcelParser(),
  new GenericCsvParser(),
];

export async function parseCsvFile(fileOrContent: File | string): Promise<ParseResult> {
  // 檢查是否為 JSON 備份檔 (.json)
  if (typeof fileOrContent !== 'string' && fileOrContent.name.endsWith('.json')) {
    return await parseJsonBackupFile(fileOrContent);
  }

  // 檢查是否為 Excel 檔案 (.xlsx / .xls)
  if (typeof fileOrContent !== 'string' && (fileOrContent.name.endsWith('.xlsx') || fileOrContent.name.endsWith('.xls'))) {
    return await parseExcelFile(fileOrContent);
  }

  let content = '';
  if (typeof fileOrContent === 'string') {
    content = fileOrContent;
  } else {
    content = await fileOrContent.text();
  }

  return new Promise((resolve) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data as Record<string, string>[];
        if (!rawRows || rawRows.length === 0) {
          resolve({
            success: false,
            formatName: '未知格式',
            records: [],
            errors: ['檔案沒有包含有效內容或標頭'],
            totalRows: 0,
          });
          return;
        }

        const headers = results.meta.fields || Object.keys(rawRows[0] || {});

        // 選擇匹配的解析器
        let selectedParser = availableParsers.find((p) => p.canParse(headers));
        if (!selectedParser) {
          // 若無特定匹配，則退回通用解析器
          selectedParser = availableParsers[availableParsers.length - 1];
        }

        const parseRes = selectedParser.parse(rawRows);
        resolve(parseRes);
      },
      error: (err: any) => {
        resolve({
          success: false,
          formatName: '解析失敗',
          records: [],
          errors: [`CSV 讀取錯誤: ${err?.message || '未知錯誤'}`],
          totalRows: 0,
        });
      },
    });
  });
}

async function parseJsonBackupFile(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const records = Array.isArray(parsed) ? parsed : (parsed.records || []);

    const validRecords: BodyRecord[] = records.filter((r: any) => r && r.date && typeof r.weight === 'number');

    return {
      success: validRecords.length > 0,
      formatName: '本站 JSON 完整備份 (.json)',
      records: validRecords,
      errors: validRecords.length === 0 ? ['JSON 檔案中找不到有效的體重紀錄'] : [],
      totalRows: records.length,
    };
  } catch (err: any) {
    return {
      success: false,
      formatName: 'JSON 解析失敗',
      records: [],
      errors: [`JSON 讀取錯誤: ${err?.message || '檔案格式不符'}`],
      totalRows: 0,
    };
  }
}

async function parseExcelFile(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 轉為 2D 矩陣陣列
    const matrix = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    if (!matrix || matrix.length === 0) {
      return {
        success: false,
        formatName: 'Excel 格式',
        records: [],
        errors: ['Excel 試算表沒有包含內容'],
        totalRows: 0,
      };
    }

    // 尋找有效標頭行
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(10, matrix.length); i++) {
      const row = matrix[i];
      if (Array.isArray(row) && row.length >= 3) {
        const rowStr = row.map(c => String(c).trim()).join(' ');
        if ((rowStr.includes('日期') || rowStr.includes('Date')) && (rowStr.includes('體重') || rowStr.includes('Weight'))) {
          headerRowIdx = i;
          break;
        }
      }
    }

    if (headerRowIdx === -1) {
      return {
        success: false,
        formatName: 'Excel 格式',
        records: [],
        errors: ['無法在 Excel 中找到有效的欄位標頭 (如 日期、體重)'],
        totalRows: 0,
      };
    }

    const headers = matrix[headerRowIdx].map(c => String(c).trim());
    const rawRows: Record<string, string>[] = [];

    for (let i = headerRowIdx + 1; i < matrix.length; i++) {
      const row = matrix[i];
      if (!row || row.length === 0) continue;
      const rowObj: Record<string, string> = {};
      headers.forEach((h, colIdx) => {
        if (h && row[colIdx] !== undefined && row[colIdx] !== null) {
          rowObj[h] = String(row[colIdx]).trim();
        }
      });
      if (Object.keys(rowObj).length > 0) {
        rawRows.push(rowObj);
      }
    }

    let selectedParser = availableParsers.find((p) => p.canParse(headers));
    if (!selectedParser) {
      selectedParser = availableParsers.find((p) => p.id === 'okok') || availableParsers[availableParsers.length - 1];
    }

    return selectedParser.parse(rawRows);
  } catch (err: any) {
    return {
      success: false,
      formatName: 'Excel 解析失敗',
      records: [],
      errors: [`Excel 檔案讀取錯誤: ${err?.message || '未知錯誤'}`],
      totalRows: 0,
    };
  }
}

export function getRegisteredParsers(): { id: string; name: string; description: string }[] {
  const list = availableParsers.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));

  list.push({
    id: 'json_backup',
    name: '本站 JSON 完整備份 (.json)',
    description: '支援本系統導出之 JSON 完整備份數據 (包含全部完整數據欄位與備註)',
  });

  return list;
}
