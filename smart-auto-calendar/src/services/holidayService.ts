import { format, addDays, startOfYear, endOfYear, eachDayOfInterval, isSameDay } from 'date-fns';

// Simplified Korean Holiday Logic
// In a real app, you'd use a Public Data API (e.g., Korea Astronomy and Space Science Institute)
// For this demo, we'll implement fixed holidays and a few known lunar ones for 2024-2026.

const FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: '신정' },
  { month: 3, day: 1, name: '삼일절' },
  { month: 5, day: 5, name: '어린이날' },
  { month: 6, day: 6, name: '현충일' },
  { month: 8, day: 15, name: '광복절' },
  { month: 10, day: 3, name: '개천절' },
  { month: 10, day: 9, name: '한글날' },
  { month: 12, day: 25, name: '성탄절' },
];

// Known Lunar Holidays (Solar Dates) for 2024-2026
const LUNAR_HOLIDAYS: Record<string, string> = {
  // 2024
  '2024-02-09': '설날 연휴',
  '2024-02-10': '설날',
  '2024-02-11': '설날 연휴',
  '2024-02-12': '대체공휴일',
  '2024-05-15': '부처님오신날',
  '2024-09-16': '추석 연휴',
  '2024-09-17': '추석',
  '2024-09-18': '추석 연휴',
  // 2025
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설날 연휴',
  '2025-05-05': '부처님오신날', // Also Children's Day
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '대체공휴일',
  // 2026
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-05-24': '부처님오신날',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
};

export function getHolidays(year: number) {
  const holidays: Record<string, string> = {};

  // Fixed holidays
  FIXED_HOLIDAYS.forEach(h => {
    const dateStr = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`;
    holidays[dateStr] = h.name;
  });

  // Add lunar holidays for the specific year if we have them
  Object.entries(LUNAR_HOLIDAYS).forEach(([date, name]) => {
    if (date.startsWith(String(year))) {
      holidays[date] = name;
    }
  });

  // Simple Substitute Holiday Logic (for fixed holidays falling on weekends)
  // This is a simplified version of the actual law.
  FIXED_HOLIDAYS.forEach(h => {
    const date = new Date(year, h.month - 1, h.day);
    const dayOfWeek = date.getDay(); // 0: Sun, 6: Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // If it's a weekend, the next Monday is usually a substitute holiday
      // Only for certain holidays (Samiljeol, Gwangbokjeol, Gaecheonjeol, Hangeulnal, Children's Day)
      const subHolidays = [3, 8, 10, 5]; // Months of Samiljeol, Gwangbokjeol, Gaecheonjeol/Hangeulnal, Children's Day
      if (subHolidays.includes(h.month)) {
        const subDate = addDays(date, dayOfWeek === 0 ? 1 : 2);
        const subDateStr = format(subDate, 'yyyy-MM-dd');
        if (!holidays[subDateStr]) {
          holidays[subDateStr] = '대체공휴일';
        }
      }
    }
  });

  return holidays;
}
