import { Solar, Lunar } from 'lunar-javascript';
import { format, parseISO, addDays, addWeeks, addMonths, addYears, isSameDay, isWithinInterval } from 'date-fns';

/**
 * Converts a solar date string (YYYY-MM-DD) to its lunar counterpart.
 */
export function getLunarFromSolar(solarDateStr: string) {
  const solar = Solar.fromYmd(...solarDateStr.split('-').map(Number) as [number, number, number]);
  const lunar = solar.getLunar();
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    isLeap: lunar.getMonth() < 0
  };
}

/**
 * Finds the solar date for a given lunar year, month, and day.
 */
export function getSolarFromLunar(year: number, month: number, day: number) {
  try {
    const lunar = Lunar.fromYmd(year, month, day);
    const solar = lunar.getSolar();
    return format(new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay()), 'yyyy-MM-dd');
  } catch (e) {
    return null;
  }
}

/**
 * Checks if a given solar date matches a lunar recurrence rule.
 * For example: "Every Lunar Month 1st" or "Every Lunar Year Month 1, Day 1".
 */
export function isLunarRecurrenceMatch(
  currentSolarDate: Date,
  originalStartDateStr: string,
  type: 'monthly' | 'yearly',
  interval: number
) {
  const currentSolarStr = format(currentSolarDate, 'yyyy-MM-dd');
  const currentLunar = getLunarFromSolar(currentSolarStr);
  const originalLunar = getLunarFromSolar(originalStartDateStr);

  if (type === 'yearly') {
    // Check if lunar month and day match
    if (currentLunar.month === originalLunar.month && currentLunar.day === originalLunar.day) {
      // Check interval (years)
      const yearDiff = currentLunar.year - originalLunar.year;
      return yearDiff >= 0 && yearDiff % interval === 0;
    }
  } else if (type === 'monthly') {
    // Check if lunar day matches
    if (currentLunar.day === originalLunar.day) {
      // Check interval (months)
      const totalMonthsOriginal = originalLunar.year * 12 + Math.abs(originalLunar.month);
      const totalMonthsCurrent = currentLunar.year * 12 + Math.abs(currentLunar.month);
      const monthDiff = totalMonthsCurrent - totalMonthsOriginal;
      return monthDiff >= 0 && monthDiff % interval === 0;
    }
  }

  return false;
}
