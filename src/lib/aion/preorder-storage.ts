const KEY = "aion_preorder_meta_v1";

export type PreorderLine = {
  dishId: string;
  name: string;
  quantity: number;
  lineTotal: number;
};

export type PreorderMeta = {
  date: string;
  time: string;
  partySize: number;
  name: string;
  email: string;
  orderRef: string;
  createdAt: string;
  lines: PreorderLine[];
  subtotal: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isPreorderMeta(v: unknown): v is PreorderMeta {
  if (!isRecord(v)) return false;
  if (typeof v.date !== "string") return false;
  if (typeof v.time !== "string") return false;
  if (typeof v.partySize !== "number") return false;
  if (typeof v.name !== "string") return false;
  if (typeof v.email !== "string") return false;
  if (typeof v.orderRef !== "string") return false;
  if (typeof v.createdAt !== "string") return false;
  if (!Array.isArray(v.lines)) return false;
  for (const line of v.lines) {
    if (!isRecord(line)) return false;
    if (typeof line.dishId !== "string") return false;
    if (typeof line.name !== "string") return false;
    if (typeof line.quantity !== "number") return false;
    if (typeof line.lineTotal !== "number") return false;
  }
  if (typeof v.subtotal !== "number") return false;
  return true;
}

export function savePreorderMeta(data: PreorderMeta): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // explicit no-op: storage can fail in private mode; caller may show error UI
  }
}

export function loadPreorderMeta(): PreorderMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPreorderMeta(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPreorderMeta(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
