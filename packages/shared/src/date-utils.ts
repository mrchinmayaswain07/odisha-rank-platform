/**
 * @odisha-rank/shared - Centralized Indian Standard Time (IST) Date & Calendar Utilities
 * 
 * OdishaRank is designed for Indian competitive examinations (OPSC, OSSC, OSSSC).
 * All study sessions, daily tasks, study streaks, and date analytics must strictly
 * adhere to Indian calendar days (Asia/Kolkata, UTC+05:30) and NEVER to UTC midnight.
 */

export const APP_TIMEZONE = "Asia/Kolkata";

/**
 * Parses any date, timestamp string, or epoch into a valid Date object.
 */
function toDate(input?: Date | string | number | null): Date {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Returns YYYY-MM-DD in Asia/Kolkata (Indian Standard Time).
 * Guaranteed to accurately reflect the Indian day even if host machine or device is in another timezone.
 */
export function getIndianDateStr(dateInput?: Date | string | number | null): string {
  const d = toDate(dateInput);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Returns YYYY-MM in Asia/Kolkata (Indian Standard Time).
 */
export function getIndianMonthPrefix(dateInput?: Date | string | number | null): string {
  return getIndianDateStr(dateInput).slice(0, 7);
}

/**
 * Returns the year, month (1-12), and day (1-31) in Asia/Kolkata.
 */
export function getIndianDateComponents(dateInput?: Date | string | number | null): {
  year: number;
  month: number;
  day: number;
  dateStr: string;
} {
  const dateStr = getIndianDateStr(dateInput);
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day, dateStr };
}

/**
 * Adds or subtracts calendar days from an existing YYYY-MM-DD date string.
 */
export function addDaysToIndianDate(dateStr: string, daysToAdd: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Using UTC noon avoids any daylight saving shifts and guarantees clean day stepping
  const dt = new Date(Date.UTC(year, month - 1, day + daysToAdd, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

/**
 * Returns the consecutive past N Indian calendar days ending with baseDate (today by default).
 * Index 0 is baseDate (e.g. today), index 1 is yesterday, etc.
 */
export function getIndianPastDays(daysCount: number, baseDate?: Date | string | number | null): string[] {
  const baseDateStr = getIndianDateStr(baseDate);
  const days: string[] = [];
  for (let i = 0; i < daysCount; i++) {
    days.push(addDaysToIndianDate(baseDateStr, -i));
  }
  return days;
}

export interface IndianPastDateItem {
  dateStr: string;
  dayName: string;
  dayNum: number;
  monthName: string;
  isToday: boolean;
}

/**
 * Returns past N days formatted for date selector components (e.g. 7-day Study Plan selector).
 */
export function getIndianPastDateItems(daysCount: number = 7, baseDate?: Date | string | number | null): IndianPastDateItem[] {
  const baseDateStr = getIndianDateStr(baseDate);
  const items: IndianPastDateItem[] = [];

  for (let i = 0; i < daysCount; i++) {
    const dateStr = addDaysToIndianDate(baseDateStr, -i);
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    const dayNum = dt.getUTCDate();
    const dayName =
      i === 0
        ? "Today"
        : i === 1
        ? "Y'day"
        : new Intl.DateTimeFormat("en-IN", {
            timeZone: APP_TIMEZONE,
            weekday: "short",
          }).format(dt);

    const monthName = new Intl.DateTimeFormat("en-IN", {
      timeZone: APP_TIMEZONE,
      month: "short",
    }).format(dt);

    items.push({
      dateStr,
      dayName,
      dayNum,
      monthName,
      isToday: i === 0,
    });
  }

  return items;
}

/**
 * Calculates calendar day difference between targetDateStr and fromDateStr (YYYY-MM-DD).
 * Returns >= 0.
 */
export function getDaysDifference(targetDateStr: string, fromDateStr?: string): number {
  const from = fromDateStr || getIndianDateStr();
  const [y1, m1, d1] = targetDateStr.split("-").map(Number);
  const [y2, m2, d2] = from.split("-").map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const diff = Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Checks if a given timestamp (ISO string, Date, or epoch) falls on a specific Indian date.
 */
export function isTimestampInIndianDate(timestamp: Date | string | number | null | undefined, targetDateStr: string): boolean {
  if (!timestamp) return false;
  return getIndianDateStr(timestamp) === targetDateStr;
}

/**
 * Checks if a given timestamp falls in a specific Indian month prefix (YYYY-MM).
 */
export function isTimestampInIndianMonth(timestamp: Date | string | number | null | undefined, targetMonthPrefix: string): boolean {
  if (!timestamp) return false;
  return getIndianDateStr(timestamp).startsWith(targetMonthPrefix);
}

/**
 * Formats a YYYY-MM-DD date string into a friendly Indian localized label.
 */
export function formatIndianDateLabel(dateStr: string, baseDate?: Date | string | number | null): string {
  const todayStr = getIndianDateStr(baseDate);
  if (dateStr === todayStr) return "Today";
  const yesterdayStr = addDaysToIndianDate(todayStr, -1);
  if (dateStr === yesterdayStr) return "Yesterday";

  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleDateString("en-IN", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Calculate Indian week bounds (Monday to Sunday) for the given date.
 */
export function getIndianWeekRange(baseDate?: Date | string | number | null): {
  startStr: string;
  endStr: string;
  days: string[];
} {
  const currDateStr = getIndianDateStr(baseDate);
  const [y, m, d] = currDateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = dt.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  // In India, weeks conventionally start on Monday (diff from Monday):
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayStr = addDaysToIndianDate(currDateStr, diffToMonday);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDaysToIndianDate(mondayStr, i));
  }

  return {
    startStr: mondayStr,
    endStr: days[6],
    days,
  };
}
