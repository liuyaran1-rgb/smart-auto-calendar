import React, { useState } from 'react';
import { X, Plus, Trash2, Palette, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { Category } from '../types';
import { cn } from '../lib/utils';

interface CategorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSaveCategories: (categories: Category[]) => void;
  onSyncGoogle: (isDemo?: boolean) => void;
  isSyncing: boolean;
}

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#06b6d4'
];

export const CategorySettingsModal: React.FC<CategorySettingsModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
  onSyncGoogle,
  isSyncing
}) => {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  if (!isOpen) return null;

  const handleAddCategory = () => {
    if (!newLabel.trim()) return;
    const newCat: Category = {
      id: Math.random().toString(36).substr(2, 9),
      label: newLabel.trim(),
      color: newColor
    };
    const updated = [...localCategories, newCat];
    setLocalCategories(updated);
    setNewLabel('');
    onSaveCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
    if (localCategories.length <= 1) {
      alert('최소 하나의 카테고리는 있어야 합니다.');
      return;
    }
    const updated = localCategories.filter(c => c.id !== id);
    setLocalCategories(updated);
    onSaveCategories(updated);
  };

  const handleUpdateColor = (id: string, color: string) => {
    const updated = localCategories.map(c => c.id === id ? { ...c, color } : c);
    setLocalCategories(updated);
    onSaveCategories(updated);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">카테고리 관리</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Category */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">새 카테고리 추가</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="카테고리 이름"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: newColor }}
                />
              </div>
              <input 
                type="color" 
                value={newColor} 
                onChange={(e) => setNewColor(e.target.value)}
                className="w-10 h-10 p-0 border-none bg-transparent cursor-pointer"
              />
              <button
                onClick={handleAddCategory}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">기존 카테고리</label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {localCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-200 shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={cat.color} 
                      onChange={(e) => handleUpdateColor(cat.id, e.target.value)}
                      className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                    />
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* External Calendar Sync */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">외부 캘린더 연동</label>
              <button 
                onClick={() => onSyncGoogle(true)}
                className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition-colors"
              >
                데모 데이터로 테스트
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onSyncGoogle()}
                disabled={isSyncing}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm",
                  isSyncing && "opacity-50 cursor-not-allowed"
                )}
              >
                <RefreshCw size={18} className={cn(isSyncing && "animate-spin")} />
                <span>Google 동기화</span>
              </button>
              <button
                onClick={() => alert('Apple 캘린더 연동은 준비 중입니다.')}
                className="flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
              >
                <CalendarIcon size={18} />
                <span>Apple 동기화</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 transition-colors shadow-lg"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
