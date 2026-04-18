import { promises as fs } from "node:fs";
import path from "node:path";
import { SeoPageRecord } from "./types";

const STORE_PATH = path.join(process.cwd(), "data", "seo-pages.json");

async function ensureStoreExists(): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });

  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, "[]", "utf8");
  }
}

async function readAllRecords(): Promise<SeoPageRecord[]> {
  await ensureStoreExists();
  const raw = await fs.readFile(STORE_PATH, "utf8");

  if (!raw.trim()) {
    return [];
  }

  return JSON.parse(raw) as SeoPageRecord[];
}

async function writeAllRecords(records: SeoPageRecord[]): Promise<void> {
  await ensureStoreExists();
  await fs.writeFile(STORE_PATH, JSON.stringify(records, null, 2), "utf8");
}

export async function findSeoPageByHash(inputHash: string): Promise<SeoPageRecord | null> {
  const records = await readAllRecords();
  return records.find((record) => record.input_hash === inputHash) ?? null;
}

export async function findSeoPageBySlug(slug: string): Promise<SeoPageRecord | null> {
  const records = await readAllRecords();
  return records.find((record) => record.slug === slug) ?? null;
}

export async function findSeoPageByUrl(url: string): Promise<SeoPageRecord | null> {
  const records = await readAllRecords();
  return records.find((record) => record.payload_json.url === url) ?? null;
}

export async function listSeoPages(): Promise<SeoPageRecord[]> {
  return readAllRecords();
}

export async function upsertSeoPage(record: SeoPageRecord): Promise<SeoPageRecord> {
  const records = await readAllRecords();
  const index = records.findIndex((item) => item.input_hash === record.input_hash);

  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }

  await writeAllRecords(records);
  return record;
}
