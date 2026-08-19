import Papa from 'papaparse';
import { IBodyDataParser, ParseResult } from '../../types/bodyComposition';
import { OmronCsvParser } from './omronParser';
import { GenericCsvParser } from './genericParser';

const availableParsers: IBodyDataParser[] = [
  new OmronCsvParser(),
  new GenericCsvParser(),
];

export async function parseCsvFile(fileOrContent: File | string): Promise<ParseResult> {
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

export function getRegisteredParsers(): { id: string; name: string; description: string }[] {
  return availableParsers.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));
}
