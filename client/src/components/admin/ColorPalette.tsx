import { useState, useEffect, useMemo } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineMagnifyingGlass, HiXMark, HiCheck } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';

export interface ColorItem {
  hex: string;
  name: string;
}

interface Props {
  colors: ColorItem[];
  onChange: (colors: ColorItem[]) => void;
}

export default function ColorPalette({ colors, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newHex, setNewHex] = useState('#000000');
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const [availableColors, setAvailableColors] = useState<ColorItem[]>([]);

  // Load all previously used colors across all products
  useEffect(() => {
    api.get('/products/filters').then((r) => {
      setAvailableColors(r.data.colors || []);
    }).catch(() => {});
  }, [pickerOpen]);

  const addColor = (color: ColorItem) => {
    if (colors.some((c) => c.hex.toLowerCase() === color.hex.toLowerCase())) return;
    onChange([...colors, color]);
  };

  const removeColor = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  const createAndAdd = () => {
    if (!newName.trim()) return;
    addColor({ hex: newHex, name: newName.trim() });
    setNewHex('#000000');
    setNewName('');
    setSearch('');
    setPickerOpen(false);
  };

  const filteredAvailable = useMemo(() => {
    const usedHex = new Set(colors.map((c) => c.hex.toLowerCase()));
    const q = search.trim().toLowerCase();
    return availableColors
      .filter((c) => !usedHex.has(c.hex.toLowerCase()))
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q));
  }, [availableColors, colors, search]);

  const searchMatchesHex = /^#[0-9a-f]{3,6}$/i.test(search.trim());

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">Цвета</p>
        <button
          type="button"
          onClick={() => setPickerOpen(!pickerOpen)}
          className="flex items-center gap-1 text-xs text-[#C4A882] hover:text-[#A68E6A] transition-colors font-medium"
        >
          <HiOutlinePlus className="w-3.5 h-3.5" />
          {pickerOpen ? 'Скрыть' : 'Добавить цвет'}
        </button>
      </div>

      {/* Existing (selected) colors */}
      <div className="flex flex-wrap gap-2 mb-3">
        {colors.map((color, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-white border border-[#E5E5E3] rounded-lg pl-2 pr-1 py-1 group"
          >
            <span
              className="w-5 h-5 rounded-full border border-[#E5E5E3] flex-shrink-0"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-sm">{color.name}</span>
            <span className="text-[10px] text-[#6B6B6B] font-mono">{color.hex}</span>
            <button
              type="button"
              onClick={() => removeColor(i)}
              className="text-[#6B6B6B] hover:text-red-500 transition-colors p-1"
            >
              <HiXMark className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {colors.length === 0 && !pickerOpen && (
          <p className="text-xs text-[#6B6B6B]">Нет цветов. Нажмите «Добавить цвет».</p>
        )}
      </div>

      {/* Picker panel */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-[#FAFAF8] to-[#F5F0EB] border border-[#E5E5E3] rounded-2xl p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по названию или #hex..."
                  className="w-full bg-white border border-[#E5E5E3] rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1A1A]"
                  >
                    <HiXMark className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Existing palette */}
              {filteredAvailable.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#6B6B6B] mb-2 uppercase tracking-wider">
                    Использованные цвета
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
                    {filteredAvailable.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => addColor(color)}
                        className="flex items-center gap-2 bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-2 hover:border-[#C4A882] hover:shadow-sm transition-all group text-left"
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-[#E5E5E3] flex-shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{color.name}</p>
                          <p className="text-[10px] text-[#6B6B6B] font-mono">{color.hex}</p>
                        </div>
                        <HiOutlinePlus className="w-3.5 h-3.5 text-[#C4A882] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredAvailable.length === 0 && search && !searchMatchesHex && (
                <p className="text-xs text-[#6B6B6B] text-center py-2">
                  Ничего не найдено. Создайте новый цвет ниже.
                </p>
              )}

              {/* Create new color */}
              <div>
                <p className="text-xs font-medium text-[#6B6B6B] mb-2 uppercase tracking-wider">
                  Создать новый цвет
                </p>
                <div className="bg-white rounded-xl p-3 border border-[#E5E5E3]">
                  <div className="flex items-start gap-3">
                    {/* Color picker */}
                    <div className="relative">
                      <input
                        type="color"
                        value={newHex}
                        onChange={(e) => setNewHex(e.target.value)}
                        className="sr-only peer"
                        id="color-picker"
                      />
                      <label
                        htmlFor="color-picker"
                        className="block w-16 h-16 rounded-xl border-2 border-[#E5E5E3] cursor-pointer hover:border-[#C4A882] transition-colors shadow-inner"
                        style={{ backgroundColor: newHex }}
                      />
                    </div>

                    {/* Fields */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createAndAdd(); } }}
                        placeholder="Название (Чёрный, Бежевый...)"
                        className="w-full border border-[#E5E5E3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882] transition-colors"
                      />
                      <input
                        type="text"
                        value={newHex}
                        onChange={(e) => {
                          const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
                          setNewHex(v);
                        }}
                        placeholder="#000000"
                        className="w-full border border-[#E5E5E3] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#C4A882] transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={createAndAdd}
                    disabled={!newName.trim()}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 bg-[#1A1A1A] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <HiCheck className="w-4 h-4" />
                    Создать и добавить
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
