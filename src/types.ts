export interface Category {
  id: string;
  label: string;
  color: string; // Hex color
}

export interface Recurrence {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N (days/weeks/months/years)
  isLunar: boolean; // For lunar recurrence
}

export interface Schedule {
  id: string;
  title: string;
  startDate: string; // ISO string (YYYY-MM-DD)
  endDate: string;   // ISO string (YYYY-MM-DD)
  time?: string;     // HH:mm
  memo?: string;
  location?: string;
  link?: string;
  reminderMinutes?: number; // Minutes before the event to show a notification
  categoryId: string;
  color?: string;    // Custom color for this specific schedule (optional, overrides category)
  uid: string;
  createdAt: string;
  recurrence?: Recurrence;
  source?: 'local' | 'google' | 'apple'; // Source of the schedule
}

export interface ScheduleTemplate {
  id: string;
  title: string;
  time?: string;
  memo?: string;
  location?: string;
  link?: string;
  reminderMinutes?: number;
  categoryId: string;
  color?: string;
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isHoliday: boolean;
}
