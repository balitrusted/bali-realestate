/**
 * Import properties from CSV into data/properties.ts
 *
 * Usage: npx tsx scripts/import-csv.ts [path/to/properties.csv]
 * Default CSV path: properties.csv (in project root)
 *
 * Import is limited to 50 data rows (see MAX_ROWS). Only the first 50 records
 * are converted; the rest of the file is not read for conversion.
 *
 * Encoding: CSV is read and written as UTF-8. For emojis and special characters
 * (e.g. bullets, apostrophes, Cyrillic "Да"), save the CSV as UTF-8 (in Excel:
 * "CSV UTF-8 (Comma delimited)" or export with UTF-8 encoding). Re-importing
 * with UTF-8 CSV will fix features (bathtub, pool, etc.) and preserve emojis.
 *
 * CSV must have header row. Expected columns (names case-insensitive, _ or -):
 * villa_number (required), title, internal_name, description, object_type, deal_type,
 * main_area, sub_area, bedrooms, bathrooms, price_monthly, price_yearly, price_currency,
 * price_forsale, duration_min, duration_max, order,
 * bathtub, car_parking, desk, nature_view, pool
 */

import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Property, PropertyType } from "../types/property";
import type { MainArea, SubArea } from "../types/property";
import { generatePropertiesFile } from "../lib/generatePropertiesFile";
import { normalizePropertyFeatures, type FeatureTriState } from "../lib/featureState";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const DEFAULT_CSV = join(PROJECT_ROOT, "properties.csv");
const OUTPUT_FILE = join(PROJECT_ROOT, "data", "properties.ts");

/** Max data rows to import (excluding header). */
const MAX_ROWS = 50;

// Normalize quote chars so parser sees standard " (handles smart quotes / encoding)
function normalizeQuotes(text: string): string {
  return text
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u201E/g, '"')
    .replace(/\u201F/g, '"')
    .replace(/\uFF02/g, '"');
}

/**
 * Parse CSV: columns = parameters (villa_number, title, ...), rows = villas.
 * Semicolon (;) = column separator, newline = row separator.
 * Newlines inside quoted "..." are part of the cell (one row = one villa).
 */
function parseCSV(csvText: string): Record<string, string>[] {
  const text = normalizeQuotes(csvText).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ";") {
        currentRow.push(field.trim());
        field = "";
      } else if (c === "\n") {
        currentRow.push(field.trim());
        field = "";
        if (currentRow.some((cell) => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        field += c;
      }
    }
  }
  if (field !== "" || currentRow.length > 0) {
    currentRow.push(field.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) =>
    String(h).toLowerCase().replace(/-/g, "_").replace(/\s+/g, "_")
  );
  const result: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? "").trim();
    });
    result.push(obj);
  }
  return result;
}

function num(val: string): number | undefined {
  const n = parseInt(String(val).replace(/\s/g, ""), 10);
  return isNaN(n) ? undefined : n;
}

function bool(val: string): boolean {
  const v = String(val).toLowerCase().trim();
  if (!v) return false;
  // Standard
  if (["true", "1", "yes", "y", "on", "да"].includes(v)) return true;
  // Mojibake: CSV saved in CP1251 (Russian "Да") read as Latin1 → ÈÑÒÈÍÀ
  if (/^[èñòèíà]+$/i.test(v)) return true;
  if (v === "èñòèíà" || v === "\u00e8\u00f1\u00f2\u00e8\u00ed\u00e0") return true;
  return false;
}

/** CSV cell → yes / no / no-info-yet (empty cell = unknown) */
function csvFeature(val: string): FeatureTriState {
  const raw = String(val).trim();
  if (!raw || raw === "-" || raw === "?") return "unknown";
  const v = raw.toLowerCase();
  if (["no", "n", "false", "0", "off", "нет"].includes(v)) return "no";
  if (bool(raw)) return "yes";
  return "unknown";
}

function getStr(row: Record<string, string>, key: string): string {
  const k = key.toLowerCase().replace(/-/g, "_");
  return (row[k] ?? "").trim();
}

function rowToProperty(row: Record<string, string>, index: number): Property | null {
  const villaNumber =
    getStr(row, "villa_number") ||
    getStr(row, "villa number") ||
    getStr(row, "number") ||
    getStr(row, "no") ||
    getStr(row, "villa_no") ||
    getStr(row, "номер") ||
    getStr(row, "номер_виллы") ||
    getStr(row, "№") ||
    (Object.keys(row).length > 0 ? String((Object.values(row)[0] ?? "").trim()) : "");
  if (!villaNumber) {
    console.warn(`Row ${index + 2}: missing villa number (column villa_number / number / no / номер), skipped`);
    return null;
  }

  const objectType = getStr(row, "object_type").toLowerCase();
  const dealType = getStr(row, "deal_type").toLowerCase();
  let types: PropertyType[] = [];
  if (objectType === "land") {
    types = ["land"];
  } else if (objectType === "business") {
    types = ["business"];
  } else {
    types = dealType.split(/[,;]/).map((t) => t.trim().toLowerCase()).filter(Boolean) as PropertyType[];
    if (types.length === 0) types = ["rent"];
  }

  const mainAreaRaw = (getStr(row, "main_area") || "ubud").toLowerCase().replace(/\s+/g, "_");
  const mainArea = mainAreaRaw as MainArea;
  const subAreaStr = getStr(row, "sub_area").toLowerCase().replace(/\s+/g, "_");
  // Only default to gentong for Ubud; other areas often have no sub-area in the table
  const subArea: SubArea | undefined =
    subAreaStr
      ? (subAreaStr as SubArea)
      : mainArea === "ubud"
        ? ("gentong" as SubArea)
        : undefined;
  const exactLocation = getStr(row, "exact_location") || undefined;
  const displayLocation = getStr(row, "display_location") || undefined;
  const bedrooms = num(getStr(row, "bedrooms")) ?? 1;
  const bathrooms = num(getStr(row, "bathrooms"));
  const priceMonthly = num(getStr(row, "price_monthly"));
  const priceYearly = num(getStr(row, "price_yearly"));
  const priceForSale = num(getStr(row, "price_forsale"));
  const currency = (getStr(row, "price_currency") || "IDR").toUpperCase() === "USD" ? "USD" : "IDR";
  const durationMin = num(getStr(row, "duration_min"));
  const durationMax = num(getStr(row, "duration_max"));
  const order = num(getStr(row, "order"));

  const priceMin = priceMonthly ?? priceForSale ?? 0;

  const prop: Property = {
    id: `prop-${villaNumber.replace(/\s/g, "-")}-${index}`,
    villaNumber,
    title: getStr(row, "title") || undefined,
    internalName: getStr(row, "internal_name") || undefined,
    description: getStr(row, "description") || undefined,
    types,
    mainArea: mainArea as MainArea,
    ...(subArea != null && { subArea }),
    exactLocation,
    displayLocation,
    bedrooms,
    bathrooms: bathrooms ?? undefined,
    price: {
      currency,
      min: priceMin,
      monthly: priceMonthly ?? undefined,
      yearly: priceYearly ?? undefined,
      forSale: priceForSale ?? undefined,
    },
    duration:
      durationMin != null
        ? { min: durationMin, max: durationMax ?? undefined }
        : undefined,
    features: normalizePropertyFeatures({
      bathtub: csvFeature(getStr(row, "bathtub")),
      carPark: csvFeature(getStr(row, "car_parking")),
      closedKitchen: csvFeature(getStr(row, "closed_kitchen")),
      desk: csvFeature(getStr(row, "desk")),
      enclosedLivingArea: csvFeature(getStr(row, "enclosed_living_area")),
      garage: csvFeature(getStr(row, "garage")),
      highSpeedWifi: csvFeature(getStr(row, "high_speed_wifi")),
      natureView: csvFeature(getStr(row, "nature_view")),
      petFriendly: csvFeature(getStr(row, "pet_friendly")),
      pool: csvFeature(getStr(row, "pool")),
      washingMachine: csvFeature(getStr(row, "washing_machine")),
    }),
    images: [],
    order: order ?? index,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return prop;
}

async function main() {
  const csvPath = process.argv[2] || DEFAULT_CSV;
  console.log("Reading CSV:", csvPath);

  let csvContent: string;
  try {
    csvContent = await readFile(csvPath, "utf-8");
  } catch (e) {
    console.error("Failed to read CSV:", e);
    process.exit(1);
  }
  // Strip UTF-8 BOM so first column name is not affected; keeps emojis and special chars
  if (csvContent.charCodeAt(0) === 0xfeff) {
    csvContent = csvContent.slice(1);
  }

  const allRows = parseCSV(csvContent);
  const rows = allRows.slice(0, MAX_ROWS);
  console.log("Rows in file (excluding header):", allRows.length);
  console.log("Importing (max):", rows.length);

  const properties: Property[] = [];
  for (let i = 0; i < rows.length; i++) {
    const prop = rowToProperty(rows[i], i);
    if (prop) properties.push(prop);
  }

  console.log("Properties to import:", properties.length);
  if (properties.length === 0 && rows.length > 0) {
    console.log("\nDetected CSV columns:", Object.keys(rows[0]).join(", "));
    console.log("Need a column for villa number: villa_number, Villa Number, number, or no");
  }
  const content = generatePropertiesFile(properties);
  await writeFile(OUTPUT_FILE, content, { encoding: "utf-8" });
  console.log("Written:", OUTPUT_FILE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
