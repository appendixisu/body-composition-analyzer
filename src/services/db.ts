import Dexie, { Table } from 'dexie';
import { BodyRecord } from '../types/bodyComposition';

export class BodyCompositionDatabase extends Dexie {
  records!: Table<BodyRecord, number>;

  constructor() {
    super('BodyCompositionDB');
    this.version(1).stores({
      records: '++id, timestamp, date, weight, bodyFat'
    });
  }
}

export const db = new BodyCompositionDatabase();

export async function getAllRecords(): Promise<BodyRecord[]> {
  return await db.records.orderBy('timestamp').toArray();
}

export async function addRecord(record: Omit<BodyRecord, 'id'>): Promise<number> {
  return await db.records.add(record as BodyRecord);
}

export async function bulkAddRecords(newRecords: Omit<BodyRecord, 'id'>[]): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;

  await db.transaction('rw', db.records, async () => {
    for (const record of newRecords) {
      // Check if duplicate record exists with exact same date/time
      const existing = await db.records.where('date').equals(record.date).first();
      if (existing && existing.id) {
        await db.records.update(existing.id, {
          ...record,
          id: existing.id
        });
        updated++;
      } else {
        await db.records.add(record as BodyRecord);
        added++;
      }
    }
  });

  return { added, updated };
}

export async function updateRecord(id: number, changes: Partial<BodyRecord>): Promise<number> {
  return await db.records.update(id, changes);
}

export async function deleteRecord(id: number): Promise<void> {
  return await db.records.delete(id);
}

export async function clearAllRecords(): Promise<void> {
  return await db.records.clear();
}
