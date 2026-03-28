import { readFile } from "fs/promises";
import { join } from "path";

const DATA_FILE = join(process.cwd(), "data", "notify-requests.json");

export interface NotifyRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  name: string;
  email: string;
  dateFrom?: string;
  createdAt: string;
}

/** Read notify-when-available requests (same store as POST /api/notify-requests). */
export async function getNotifyRequests(): Promise<NotifyRequest[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
