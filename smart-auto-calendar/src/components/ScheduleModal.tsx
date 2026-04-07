import React, { useState, useEffect } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { X, Trash2, Clock, AlignLeft, Tag, Calendar as CalendarIcon, Palette, Settings, Repeat, Save, Download, MapPin, Link as LinkIcon, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { Schedule, Category, Recurrence, ScheduleTemplate } from '../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Partial<Schedule>) => void;
  onDelete?: (id: string) => void;
  onManageCategories?: () => void;
  initialDate?: Date;
  initialSchedule?: Schedule | null;
  categories: Category[];
  templates: ScheduleTemplate[];
  onSaveTemplate: (template: ScheduleTemplate) => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#06b6d4'
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  onManageCategories,
  initialDate,
  initialSchedule,
  categories,
  templates,
  onSaveTemplate
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  const [memo, setMemo] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>({ type: 'none', interval: 1, isLunar: false });
  const [showRecurrence, setShowRecurrence] = useState(false);

  useEffect(() => {
    if (initialSchedule) {
      setTitle(initialSchedule.title);
      setStartDate(initialSchedule.startDate);
      setEndDate(initialSchedule.endDate);
      setTime(initialSchedule.time || '');
      setMemo(initialSchedule.memo || '');
      setLocation(initialSchedule.location || '');
      setLink(initialSchedule.link || '');
      setReminderMinutes(initialSchedule.reminderMinutes ?? '');
      setCategoryId(initialSchedule.categoryId);
      setCustomColor(initialSchedule.color || '');
      setRecurrence(initialSchedule.recurrence || { type: 'none', interval: 1, isLunar: false });
      setShowRecurrence(!!initialSchedule.recurrence && initialSchedule.recurrence.type !== 'none');
    } else if (initialDate) {
      const dateStr = format(initialDate, 'yyyy-MM-dd');
      setTitle('');
      setStartDate(dateStr);
      setEndDate(dateStr);
      setTime('');
      setMemo('');
      setLocation('');
      setLink('');
      setReminderMinutes('');
      setCategoryId(categories[0]?.id || '');
      setCustomColor('');
      setRecurrence({ type: 'none', interval: 1, isLunar: false });
      setShowRecurrence(false);
    }
  }, [initialSchedule, initialDate, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate || !categoryId) return;
    onSave({
      title,
      startDate,
      endDate,
      time: time || undefined,
      memo: memo || undefined,
      location: location || undefined,
      link: link || undefined,
      reminderMinutes: reminderMinutes === '' ? undefined : Number(reminderMinutes),
      categoryId,
      color: customColor || undefined,
      recurrence: showRecurrence ? recurrence : { type: 'none', interval: 1, isLunar: false }
    });
  };

  const handleSaveAsTemplate = () => {
    if (!title.trim()) {
      alert('일정 제목을 입력해주세요.');
      return;
    }
    const template: ScheduleTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      time: time || undefined,
      memo: memo || undefined,
      location: location || undefined,
      link: link || undefined,
      reminderMinutes: reminderMinutes === '' ? undefined : Number(reminderMinutes),
      categoryId,
      color: customColor || undefined
    };
    onSaveTemplate(template);
    alert('템플릿으로 저장되었습니다.');
  };

  const handleLoadTemplate = (template: ScheduleTemplate) => {
    setTitle(template.title);
    setTime(template.time || '');
    setMemo(template.memo || '');
    setLocation(template.location || '');
    setLink(template.link || '');
    setReminderMinutes(template.reminderMinutes ?? '');
    setCategoryId(template.categoryId);
    setCustomColor(template.color || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            {initialSchedule ? '일정 수정' : '새 일정 등록'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Templates Dropdown */}
          {templates.length > 0 && (
            <div className="flex items-center gap-3 text-gray-600">
              <Download size={18} className="shrink-0" />
              <select 
                onChange={(e) => {
                  const t = templates.find(temp => temp.id === e.target.value);
                  if (t) handleLoadTemplate(t);
                }}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue=""
              >
                <option value="" disabled>템플릿 불러오기...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <input
              autoFocus
              type="text"
              placeholder="일정 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold border-none focus:ring-0 placeholder:text-gray-300 p-0"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <CalendarIcon size={18} className="shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="text-gray-300">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Clock size={18} className="shrink-0" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <MapPin size={18} className="shrink-0" />
              <input
                type="text"
                placeholder="위치 추가"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <LinkIcon size={18} className="shrink-0" />
              <div className="flex flex-1 gap-2">
                <input
                  type="url"
                  placeholder="링크 추가 (https://...)"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                {link && (
                  <a 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title="링크 열기"
                  >
                    <Download size={16} className="rotate-[-90deg]" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Bell size={18} className="shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  placeholder="알림 (분 전)"
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-400">분 전에 알림 (시간 설정 시 작동)</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-gray-600">
              <Tag size={18} className="shrink-0 mt-1" />
              <div className="flex flex-wrap gap-2 flex-1 items-center">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold transition-all border",
                      categoryId === cat.id 
                        ? "text-white shadow-md scale-105" 
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    )}
                    style={categoryId === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                  >
                    {cat.label}
                  </button>
                ))}
                <button 
                  type="button"
                  onClick={onManageCategories}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 transition-colors ml-1"
                  title="카테고리 관리"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* Recurrence UI */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowRecurrence(!showRecurrence)}
                className={cn(
                  "flex items-center gap-3 text-sm font-bold transition-colors",
                  showRecurrence ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Repeat size={18} />
                <span>반복 설정 {showRecurrence ? '끄기' : '켜기'}</span>
              </button>

              {showRecurrence && (
                <div className="ml-7 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-4">
                    <select
                      value={recurrence.type}
                      onChange={(e) => setRecurrence({ ...recurrence, type: e.target.value as any })}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                      <option value="monthly">매달</option>
                      <option value="yearly">매년</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={recurrence.interval}
                        onChange={(e) => setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })}
                        className="w-16 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">
                        {recurrence.type === 'daily' ? '일마다' : 
                         recurrence.type === 'weekly' ? '주마다' : 
                         recurrence.type === 'monthly' ? '개월마다' : '년마다'}
                      </span>
                    </div>
                  </div>
                  
                  {(recurrence.type === 'monthly' || recurrence.type === 'yearly') && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recurrence.isLunar}
                        onChange={(e) => setRecurrence({ ...recurrence, isLunar: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">음력으로 반복</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 text-gray-600">
              <Palette size={18} className="shrink-0 mt-1" />
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomColor('')}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                    customColor === '' ? "border-blue-500" : "border-gray-200"
                  )}
                  title="카테고리 색상 사용"
                >
                  Auto
                </button>
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCustomColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                      customColor === color ? "border-black scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input 
                  type="color" 
                  value={customColor || '#000000'} 
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 text-gray-600">
              <AlignLeft size={18} className="shrink-0 mt-1" />
              <textarea
                placeholder="메모를 입력하세요"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              {initialSchedule && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(initialSchedule.id)}
                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="삭제"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all text-sm"
                title="템플릿으로 저장"
              >
                <Save size={18} />
                <span>템플릿 저장</span>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
              >
                저장
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
