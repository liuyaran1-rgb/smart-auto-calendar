import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  isWithinInterval,
  parseISO,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  addDays,
  addYears,
  subYears,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  isSameYear
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Settings, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { getHolidays } from '../services/holidayService';
import { Schedule, Category } from '../types';
import { isLunarRecurrenceMatch } from '../services/lunarService';

interface CalendarProps {
  schedules: Schedule[];
  categories: Category[];
  onDateClick: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
  onSettingsClick: () => void;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  schedules, 
  categories, 
  onDateClick, 
  onScheduleClick,
  onSettingsClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('month');
  const [holidays, setHolidays] = useState<Record<string, string>>({});

  useEffect(() => {
    setHolidays(getHolidays(currentDate.getFullYear()));
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const next = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else setCurrentDate(addYears(currentDate, 1));
  };

  const prev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'day') setCurrentDate(addDays(currentDate, -1));
    else setCurrentDate(subYears(currentDate, 1));
  };
  const goToToday = () => setCurrentDate(new Date());

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const getSchedulesForDay = (day: Date) => {
    return schedules.filter(schedule => {
      const start = parseISO(schedule.startDate);
      const end = parseISO(schedule.endDate);
      const duration = differenceInDays(end, start);

      // 1. Check if it's the original occurrence
      if (isWithinInterval(day, { start, end })) {
        return true;
      }

      // 2. Check if it's a recurring occurrence
      if (schedule.recurrence && schedule.recurrence.type !== 'none') {
        const { type, interval, isLunar } = schedule.recurrence;
        
        // Only check if current day is AFTER the original start date
        if (day < start) return false;

        if (isLunar) {
          // Lunar recurrence (only monthly or yearly supported)
          if (type === 'monthly' || type === 'yearly') {
            for (let i = 0; i <= duration; i++) {
              const checkDay = addDays(day, -i);
              if (isLunarRecurrenceMatch(checkDay, schedule.startDate, type as 'monthly' | 'yearly', interval)) {
                return true;
              }
            }
          }
        } else {
          // Solar recurrence
          if (type === 'daily') {
            const diff = differenceInDays(day, start);
            const k = Math.floor(diff / interval);
            const instanceStart = k * interval;
            return diff >= instanceStart && diff <= instanceStart + duration;
          } else if (type === 'weekly') {
            for (let i = 0; i <= duration; i++) {
              const checkDay = addDays(day, -i);
              const diffWeeks = differenceInWeeks(checkDay, start);
              if (diffWeeks >= 0 && diffWeeks % interval === 0 && checkDay.getDay() === start.getDay()) return true;
            }
          } else if (type === 'monthly') {
            for (let i = 0; i <= duration; i++) {
              const checkDay = addDays(day, -i);
              const diffMonths = differenceInMonths(checkDay, start);
              if (diffMonths >= 0 && diffMonths % interval === 0 && checkDay.getDate() === start.getDate()) return true;
            }
          } else if (type === 'yearly') {
            for (let i = 0; i <= duration; i++) {
              const checkDay = addDays(day, -i);
              const diffYears = differenceInYears(checkDay, start);
              if (diffYears >= 0 && diffYears % interval === 0 && 
                  checkDay.getMonth() === start.getMonth() && 
                  checkDay.getDate() === start.getDate()) return true;
            }
          }
        }
      }

      return false;
    });
  };

  const getScheduleStyle = (schedule: Schedule) => {
    const category = categories.find(c => c.id === schedule.categoryId);
    const bgColor = schedule.color || category?.color || '#3b82f6';
    
    return {
      backgroundColor: bgColor,
      color: '#fff',
      borderColor: 'rgba(0,0,0,0.1)'
    };
  };

  const getHeaderTitle = () => {
    if (viewMode === 'month') return format(currentDate, 'yyyy년 M월');
    if (viewMode === 'day') return format(currentDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko });
    return format(currentDate, 'yyyy년');
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
          {weekDays.map((day, i) => (
            <div 
              key={day} 
              className={cn(
                "py-3 text-center text-xs font-bold uppercase tracking-wider",
                i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-400"
              )}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 overflow-auto">
          {calendarDays.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const holidayName = holidays[dateStr];
            const isHoliday = !!holidayName;
            const daySchedules = getSchedulesForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isSun = day.getDay() === 0;
            const isSat = day.getDay() === 6;

            return (
              <div 
                key={day.toString()}
                onClick={() => onDateClick(day)}
                className={cn(
                  "min-h-[120px] p-1 border-r border-b border-gray-50 transition-colors cursor-pointer hover:bg-blue-50/30",
                  !isCurrentMonth && "bg-gray-50/30 text-gray-300",
                  isToday(day) && "bg-blue-50/50"
                )}
              >
                <div className="flex justify-between items-start mb-1 px-1">
                  <span className={cn(
                    "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full",
                    isToday(day) ? "bg-blue-600 text-white" : 
                    (isHoliday || isSun) ? "text-red-500" : 
                    isSat ? "text-blue-500" : "text-gray-700",
                    !isCurrentMonth && "text-gray-300"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {holidayName && (
                    <span className="text-[10px] font-medium text-red-400 truncate max-w-[80%]">
                      {holidayName}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {daySchedules.map(schedule => {
                    const isStart = isSameDay(day, parseISO(schedule.startDate));
                    const isEnd = isSameDay(day, parseISO(schedule.endDate));
                    return (
                      <div
                        key={schedule.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleClick(schedule);
                        }}
                        style={getScheduleStyle(schedule)}
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] truncate transition-all hover:brightness-90 active:scale-95 border-y flex items-center gap-1",
                          isStart && "rounded-l-md border-l",
                          isEnd && "rounded-r-md border-r",
                          !isStart && !isEnd && "border-x-0"
                        )}
                      >
                        {isStart && schedule.time && <span className="font-bold shrink-0">{schedule.time}</span>}
                        <span className="flex-1 truncate">{isStart ? schedule.title : '\u00A0'}</span>
                        {isStart && schedule.location && <MapPin size={8} className="shrink-0 opacity-80" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const daySchedules = getSchedulesForDay(currentDate);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const holidayName = holidays[dateStr];

    return (
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{format(currentDate, 'M월 d일')}</h3>
              <p className="text-gray-500">{format(currentDate, 'EEEE', { locale: ko })}</p>
            </div>
            {holidayName && (
              <span className="px-3 py-1 bg-red-50 text-red-500 text-sm font-bold rounded-full">
                {holidayName}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-2">일정 목록</h4>
            {daySchedules.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                <CalendarIcon className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-400">등록된 일정이 없습니다.</p>
                <button 
                  onClick={() => onDateClick(currentDate)}
                  className="mt-4 text-blue-600 font-bold hover:underline"
                >
                  새 일정 추가하기
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {daySchedules.map(schedule => (
                  <div 
                    key={schedule.id}
                    onClick={() => onScheduleClick(schedule)}
                    className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
                  >
                    <div 
                      className="w-1.5 h-12 rounded-full"
                      style={{ backgroundColor: getScheduleStyle(schedule).backgroundColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {schedule.time && (
                          <span className="text-sm font-bold text-gray-900">{schedule.time}</span>
                        )}
                        <h5 className="font-bold text-gray-800 truncate">{schedule.title}</h5>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {schedule.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {schedule.location}
                          </span>
                        )}
                        <span>{schedule.startDate} ~ {schedule.endDate}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const months = eachMonthOfInterval({
      start: yearStart,
      end: endOfYear(yearStart)
    });

    return (
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {months.map(month => {
            const monthDays = eachDayOfInterval({
              start: startOfMonth(month),
              end: endOfMonth(month)
            });
            const startDay = startOfMonth(month).getDay();

            return (
              <div 
                key={month.toString()} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setCurrentDate(month);
                  setViewMode('month');
                }}
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                  {format(month, 'M월')}
                </h3>
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map(d => (
                    <div key={d} className="text-[10px] font-bold text-gray-400 text-center mb-1">{d}</div>
                  ))}
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {monthDays.map(day => {
                    const hasSchedules = getSchedulesForDay(day).length > 0;
                    const isSun = day.getDay() === 0;
                    const isSat = day.getDay() === 6;
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isHoliday = !!holidays[dateStr];

                    return (
                      <div 
                        key={day.toString()}
                        className={cn(
                          "aspect-square flex items-center justify-center text-[10px] rounded-full transition-colors relative",
                          isToday(day) ? "bg-blue-600 text-white font-bold" :
                          (holidays[dateStr] || isSun) ? "text-red-500" :
                          isSat ? "text-blue-500" : "text-gray-600",
                          hasSchedules && !isToday(day) && "bg-blue-50 font-bold"
                        )}
                      >
                        {format(day, 'd')}
                        {hasSchedules && !isToday(day) && (
                          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800 min-w-[150px]">
              {getHeaderTitle()}
            </h2>
            <div className="flex items-center bg-gray-50 rounded-lg p-1">
              <button 
                onClick={prev}
                className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={goToToday}
                className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                오늘
              </button>
              <button 
                onClick={next}
                className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            {(['day', 'month', 'year'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-4 py-1.5 text-sm font-bold rounded-lg transition-all",
                  viewMode === mode 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {mode === 'day' ? '일' : mode === 'month' ? '월' : '연'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onSettingsClick}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            title="설정 및 연동"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => onDateClick(currentDate)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span className="font-medium">일정 추가</span>
          </button>
        </div>
      </div>

      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'year' && renderYearView()}
    </div>
  );
};
