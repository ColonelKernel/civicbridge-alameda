/**
 * Calendar-date helpers. All arithmetic happens on YYYY-MM-DD strings at UTC
 * noon so daylight-saving changes (Nov 1, 2026 falls inside typical bid
 * windows) never produce 23-hour days or off-by-one results.
 */
import type { CivicDate } from "@/lib/data/types";

export type ISODate = string; // YYYY-MM-DD

/** Alameda County observed holidays inside the demo window. Editable. */
export const COUNTY_HOLIDAYS: ISODate[] = [
  "2026-11-11", // Veterans Day
  "2026-11-26", // Thanksgiving
  "2026-11-27", // Day after Thanksgiving
  "2026-12-25", // Christmas
  "2027-01-01", // New Year's Day
  "2027-01-18", // Martin Luther King Jr. Day
  "2027-02-15", // Presidents' Day
];

function toUtcNoon(date: ISODate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function fromUtc(dt: Date): ISODate {
  return dt.toISOString().slice(0, 10);
}

/**
 * Today's date in America/Los_Angeles, unless NEXT_PUBLIC_DEMO_TODAY is set
 * (used to keep the demo stable regardless of when it is shown).
 */
export function today(): ISODate {
  const override = process.env.NEXT_PUBLIC_DEMO_TODAY;
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(date: ISODate, n: number): ISODate {
  const dt = toUtcNoon(date);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fromUtc(dt);
}

/** Calendar days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUtcNoon(to).getTime() - toUtcNoon(from).getTime()) / 86_400_000);
}

export function isWeekend(date: ISODate): boolean {
  const day = toUtcNoon(date).getUTCDay();
  return day === 0 || day === 6;
}

export function isBusinessDay(date: ISODate, holidays: ISODate[] = COUNTY_HOLIDAYS): boolean {
  return !isWeekend(date) && !holidays.includes(date);
}

/** Walk backwards `n` business days, skipping weekends and holidays. Always lands on a business day. */
export function subtractBusinessDays(
  date: ISODate,
  n: number,
  holidays: ISODate[] = COUNTY_HOLIDAYS,
): ISODate {
  let cur = date;
  let remaining = n;
  while (remaining > 0) {
    cur = addDays(cur, -1);
    if (isBusinessDay(cur, holidays)) remaining -= 1;
  }
  // If n was 0 and the date is a weekend/holiday, move earlier to a business day.
  while (!isBusinessDay(cur, holidays)) cur = addDays(cur, -1);
  return cur;
}

export function compareDates(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Tue, Oct 20" or "Tue, Oct 20, 2026" */
export function formatDate(date: ISODate, opts: { year?: boolean; weekday?: boolean } = {}): string {
  const dt = toUtcNoon(date);
  const parts: string[] = [];
  if (opts.weekday !== false) parts.push(WEEKDAYS[dt.getUTCDay()] + ",");
  parts.push(`${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`);
  const s = parts.join(" ");
  return opts.year ? `${s}, ${dt.getUTCFullYear()}` : s;
}

/** "14:00" -> "2:00 PM" */
export function formatTime(time?: string): string | undefined {
  if (!time) return undefined;
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "Tue, Oct 20 at 2:00 PM PT" */
export function formatCivic(d: CivicDate, opts: { year?: boolean } = {}): string {
  const base = formatDate(d.date, { year: opts.year });
  const t = formatTime(d.time);
  return t ? `${base} at ${t} PT` : base;
}

export function daysUntil(date: ISODate, from: ISODate = today()): number {
  return daysBetween(from, date);
}

/** Human countdown: "Due today", "Due tomorrow", "3 days left", "Closed 2 days ago" */
export function countdownLabel(date: ISODate, from: ISODate = today()): string {
  const n = daysUntil(date, from);
  if (n < 0) return n === -1 ? "Closed yesterday" : `Closed ${-n} days ago`;
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  if (n <= 14) return `${n} days left`;
  if (n <= 60) return `${Math.round(n / 7)} weeks left`;
  return `${Math.round(n / 30)} months left`;
}

export type Urgency = "past" | "critical" | "soon" | "comfortable";

export function urgency(date: ISODate, from: ISODate = today()): Urgency {
  const n = daysUntil(date, from);
  if (n < 0) return "past";
  if (n <= 7) return "critical";
  if (n <= 14) return "soon";
  return "comfortable";
}
