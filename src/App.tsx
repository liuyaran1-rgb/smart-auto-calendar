import React, { useState, useEffect, useRef } from 'react';
import { Schedule, Category, ScheduleTemplate } from './types';
import { Calendar } from './components/Calendar';
import { ScheduleModal } from './components/ScheduleModal';
import { CategorySettingsModal } from './components/CategorySettingsModal';
import { Calendar as CalendarIcon, Settings, RefreshCw } from 'lucide-react';
import { parseISO, addMinutes, isSameMinute, format } from 'date-fns';
import { cn } from './lib/utils';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', label: '업무', color: '#3b82f6' },
  { id: 'personal', label: '개인', color: '#10b981' },
  { id: 'important', label: '중요', color: '#ef4444' },
  { id: 'other', label: '기타', color: '#6b7280' },
  { id: 'google', label: 'Google 캘린더', color: '#4285F4' }, // Added Google category
];

export default function App() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const notifiedRefs = useRef<Set<string>>(new Set());

  // Load data from localStorage on mount
  useEffect(() => {
    const localSchedules = localStorage.getItem('guestSchedules');
    const localCategories = localStorage.getItem('userCategories');
    const localTemplates = localStorage.getItem('userTemplates');

    if (localSchedules) {
      try {
        setSchedules(JSON.parse(localSchedules));
      } catch (e) {
        console.error("Failed to parse local schedules", e);
      }
    }

    if (localCategories) {
      try {
        const parsed = JSON.parse(localCategories);
        // Ensure Google category exists
        if (!parsed.find((c: Category) => c.id === 'google')) {
          parsed.push({ id: 'google', label: 'Google 캘린더', color: '#4285F4' });
        }
        setCategories(parsed);
      } catch (e) {
        console.error("Failed to parse local categories", e);
      }
    }

    if (localTemplates) {
      try {
        setTemplates(JSON.parse(localTemplates));
      } catch (e) {
        console.error("Failed to parse local templates", e);
      }
    }
    setLoading(false);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // OAuth Success Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        handleSyncGoogle();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Notification Checker
  useEffect(() => {
    const interval = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      schedules.forEach(schedule => {
        if (!schedule.time || !schedule.reminderMinutes) return;

        const startDateTime = parseISO(`${schedule.startDate}T${schedule.time}`);
        const reminderTime = addMinutes(startDateTime, -schedule.reminderMinutes);

        // Check if now matches reminderTime (within the same minute)
        if (isSameMinute(now, reminderTime)) {
          const notificationId = `${schedule.id}-${format(reminderTime, 'yyyyMMddHHmm')}`;
          if (!notifiedRefs.current.has(notificationId)) {
            new Notification(`일정 알림: ${schedule.title}`, {
              body: `${schedule.time}에 일정이 시작됩니다.${schedule.location ? `\n장소: ${schedule.location}` : ''}`,
              icon: '/favicon.ico'
            });
            notifiedRefs.current.add(notificationId);
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [schedules]);

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to get OAuth URL');
      }

      window.open(data.url, 'google_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('Failed to get Google OAuth URL', error);
      alert(`Google 캘린더 연동 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\nAI Studio의 Settings > Secrets 메뉴에서 GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET을 설정했는지 확인해주세요.`);
    }
  };

  const handleSyncGoogle = async (isDemo = false) => {
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/calendar/google/events${isDemo ? '?demo=true' : ''}`);
      if (response.status === 401 && !isDemo) {
        handleConnectGoogle();
        return;
      }
      const data = await response.json();
      
      const googleEvents: Schedule[] = data.items.map((item: any) => {
        const start = item.start.dateTime || item.start.date;
        const end = item.end.dateTime || item.end.date;
        
        return {
          id: `google-${item.id}`,
          title: item.summary || '(제목 없음)',
          startDate: format(parseISO(start), 'yyyy-MM-dd'),
          endDate: format(parseISO(end), 'yyyy-MM-dd'),
          time: item.start.dateTime ? format(parseISO(start), 'HH:mm') : undefined,
          memo: item.description,
          location: item.location,
          link: item.htmlLink,
          categoryId: 'google',
          source: 'google',
          uid: 'local',
          createdAt: item.created || new Date().toISOString()
        };
      });

      // Merge Google events with local schedules (avoid duplicates)
      const localSchedules = schedules.filter(s => s.source !== 'google');
      const updatedSchedules = [...localSchedules, ...googleEvents];
      
      setSchedules(updatedSchedules);
      localStorage.setItem('guestSchedules', JSON.stringify(updatedSchedules));
      alert('Google 캘린더 일정이 동기화되었습니다.');
    } catch (error) {
      console.error('Failed to sync Google Calendar', error);
      alert('Google 캘린더 동기화에 실패했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
    setIsModalOpen(true);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    if (schedule.source === 'google') {
      if (schedule.link) window.open(schedule.link, '_blank');
      return;
    }
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleSaveSchedule = (data: Partial<Schedule>) => {
    const newSchedule: Schedule = {
      id: selectedSchedule?.id || Math.random().toString(36).substr(2, 9),
      title: data.title!,
      startDate: data.startDate!,
      endDate: data.endDate!,
      time: data.time,
      memo: data.memo,
      location: data.location,
      link: data.link,
      reminderMinutes: data.reminderMinutes,
      categoryId: data.categoryId!,
      color: data.color,
      recurrence: data.recurrence,
      source: 'local',
      uid: 'local',
      createdAt: selectedSchedule?.createdAt || new Date().toISOString(),
    };

    let updatedSchedules;
    if (selectedSchedule?.id) {
      updatedSchedules = schedules.map(s => s.id === selectedSchedule.id ? newSchedule : s);
    } else {
      updatedSchedules = [...schedules, newSchedule];
    }
    
    setSchedules(updatedSchedules);
    localStorage.setItem('guestSchedules', JSON.stringify(updatedSchedules));
    setIsModalOpen(false);
  };

  const handleDeleteSchedule = (id: string) => {
    const updatedSchedules = schedules.filter(s => s.id !== id);
    setSchedules(updatedSchedules);
    localStorage.setItem('guestSchedules', JSON.stringify(updatedSchedules));
    setIsModalOpen(false);
  };

  const handleSaveCategories = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    localStorage.setItem('userCategories', JSON.stringify(updatedCategories));
  };

  const handleSaveTemplate = (template: ScheduleTemplate) => {
    const updatedTemplates = [...templates, template];
    setTemplates(updatedTemplates);
    localStorage.setItem('userTemplates', JSON.stringify(updatedTemplates));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-200 rounded-full" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <CalendarIcon className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">Smart Calendar</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="설정 및 연동"
            >
              <Settings size={20} />
            </button>
            <div className="text-xs font-medium text-gray-400">
              로컬 저장 모드
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-[calc(100vh-12rem)] min-h-[600px]">
          <Calendar 
            schedules={schedules}
            categories={categories}
            onDateClick={handleDateClick}
            onScheduleClick={handleScheduleClick}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
        </div>
      </main>

      {/* Modal */}
      <ScheduleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSchedule}
        onDelete={handleDeleteSchedule}
        onManageCategories={() => setIsSettingsOpen(true)}
        initialDate={selectedDate}
        initialSchedule={selectedSchedule}
        categories={categories}
        templates={templates}
        onSaveTemplate={handleSaveTemplate}
      />

      {/* Category Settings Modal */}
      <CategorySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        categories={categories}
        onSaveCategories={handleSaveCategories}
        onSyncGoogle={handleSyncGoogle}
        isSyncing={isSyncing}
      />

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>© 2026 Smart Auto Calendar. All rights reserved.</p>
      </footer>
    </div>
  );
}
