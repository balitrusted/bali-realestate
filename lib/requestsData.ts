import { list, put } from "@vercel/blob";

const BLOB_KEY = "data/requests.json";

export type RequestStatus = "new" | "in_progress" | "done";

export interface SiteRequest {
  id: string;
  requestType: string;
  name: string;
  email: string;
  whatsapp?: string;
  preferredContact?: string;
  propertyType?: string;
  area?: string;
  bedrooms?: string;
  budget?: string;
  budgetPeriod?: string;
  budgetCurrency?: string;
  duration?: string[];
  message?: string;
  status?: RequestStatus;
  comment?: string;
  createdAt: string;
}

async function readFromBlob(): Promise<SiteRequest[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
    const match = blobs?.find((b) => b.pathname === BLOB_KEY);
    if (!match?.url) return [];
    const res = await fetch(match.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeToBlob(requests: SiteRequest[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(BLOB_KEY, JSON.stringify(requests), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

function normalizeRequest(r: SiteRequest): SiteRequest {
  return { ...r, status: r.status || "new" };
}

/** Get all requests (admin only). On Vercel uses Blob; locally can use file. */
export async function getRequests(): Promise<SiteRequest[]> {
  let raw: SiteRequest[] = [];
  const fromBlob = await readFromBlob();
  if (fromBlob.length > 0) raw = fromBlob;
  else {
    try {
      const { readFile } = await import("fs/promises");
      const { join } = await import("path");
      const path = join(process.cwd(), "data", "requests.json");
      const content = await readFile(path, "utf-8");
      const data = JSON.parse(content);
      raw = Array.isArray(data) ? data : [];
    } catch {
      raw = [];
    }
  }
  return raw.map(normalizeRequest);
}

/** Append one request. Saves to Blob on Vercel, else to file. */
export async function addRequest(request: SiteRequest): Promise<void> {
  const requests = (await getRequests()).map(normalizeRequest);
  requests.push({ ...request, status: "new" });
  await saveRequests(requests);
}

/** Save full list (used after update). */
export async function saveRequests(requests: SiteRequest[]): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await writeToBlob(requests);
  } else {
    const { writeFile } = await import("fs/promises");
    const { join } = await import("path");
    const path = join(process.cwd(), "data", "requests.json");
    await writeFile(path, JSON.stringify(requests, null, 2), "utf-8");
  }
}

/** Update one request (status and/or comment). */
export async function updateRequest(
  id: string,
  patch: { status?: RequestStatus; comment?: string }
): Promise<SiteRequest | null> {
  const requests = (await getRequests()).map(normalizeRequest);
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) return null;
  if (patch.status !== undefined) requests[index].status = patch.status;
  if (patch.comment !== undefined) requests[index].comment = patch.comment;
  await saveRequests(requests);
  return requests[index];
}
