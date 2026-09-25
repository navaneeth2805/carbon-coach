/**
 * Date Utilities for Calendar Day Boundary Calculations
 * Handles streak tracking and daily impact without timezone / off-by-one bugs.
 */

/**
 * Returns a normalized YYYY-MM-DD date string in local timezone
 */
export function getLocalDateString(dateInput: Date | string | number = new Date()): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates represent the exact same calendar day
 */
export function isSameCalendarDay(d1: Date | string, d2: Date | string): boolean {
  return getLocalDateString(d1) === getLocalDateString(d2);
}

/**
 * Check if date2 is the immediate consecutive calendar day after date1
 */
export function isConsecutiveDay(prevDate: Date | string, nextDate: Date | string): boolean {
  const pStr = getLocalDateString(prevDate);
  const nStr = getLocalDateString(nextDate);

  const p = new Date(`${pStr}T00:00:00`);
  const n = new Date(`${nStr}T00:00:00`);

  const diffMs = n.getTime() - p.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays === 1;
}

/**
 * Difference in calendar days between two dates (d2 - d1)
 */
export function getCalendarDayDiff(d1: Date | string, d2: Date | string): number {
  const pStr = getLocalDateString(d1);
  const nStr = getLocalDateString(d2);

  const p = new Date(`${pStr}T00:00:00`);
  const n = new Date(`${nStr}T00:00:00`);

  const diffMs = n.getTime() - p.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
