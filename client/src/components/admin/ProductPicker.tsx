import { useState, useRef, useEffect, useMemo } from 'react';
import { HiChevronDown, HiOutlineMagnifyingGlass, HiXMark, HiCheck } from 'react-icons/hi2';
import { AnimatePresence, motion } from 'framer-motion';

export interface PickerProduct {
  id: number;
  nameRu: string;
  sku?: string | null;
  images: string[];
}

interface Props {
  value: number | null;
  onChange: (id: number | null) => void;
  products: PickerProduct[];
  placeholder?: string;
  label?: string;
}

export default function ProductPicker({ value, onChange, products, placeholder = '— выберите товар —' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const selected = products.find((p) => p.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.nameRu.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [products, query]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2.5 border rounded-xl px-3 py-2 text-sm transition-colors bg-white ${
          open ? 'border-[#C4A882]' : 'border-[#E5E5E3] hover:border-[#C4A882]'
        }`}
      >
        {selected ? (
          <>
            {selected.images[0] ? (
              <img src={selected.images[0]} alt="" className="w-8 h-10 object-cover rounded-md flex-shrink-0" loading="lazy" />
            ) : (
              <div className="w-8 h-10 bg-[#F5F0EB] rounded-md flex items-center justify-center text-[10px] text-[#C4A882] flex-shrink-0">LS</div>
            )}
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium truncate text-[#1A1A1A]">{selected.nameRu}</div>
              {selected.sku && <div className="text-[11px] text-[#6B6B6B] font-mono">{selected.sku}</div>}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="p-0.5 text-[#6B6B6B] hover:text-[#1A1A1A] flex-shrink-0"
            >
              <HiXMark className="w-4 h-4" />
            </button>
          </>
        ) : (
          <span className="text-[#6B6B6B] flex-1 text-left">{placeholder}</span>
        )}
        {!selected && <HiChevronDown className={`w-4 h-4 text-[#6B6B6B] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-[#E5E5E3] overflow-hidden"
            style={{ minWidth: '280px' }}
          >
            {/* Search input */}
            <div className="p-2 border-b border-[#E5E5E3]">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                <HiOutlineMagnifyingGlass className="w-3.5 h-3.5 text-[#6B6B6B] flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Название или артикул..."
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#9B9B9B]"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')}>
                    <HiXMark className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[#6B6B6B]">Ничего не найдено</div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { onChange(p.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                      value === p.id ? 'bg-[#F5F0EB]' : 'hover:bg-gray-50'
                    }`}
                  >
                    {p.images[0] ? (
                      <img src={p.images[0]} alt="" className="w-9 h-11 object-cover rounded-md flex-shrink-0" loading="lazy" />
                    ) : (
                      <div className="w-9 h-11 bg-[#F5F0EB] rounded-md flex items-center justify-center text-[10px] text-[#C4A882] flex-shrink-0">LS</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`truncate ${value === p.id ? 'font-medium' : ''}`}>{p.nameRu}</div>
                      {p.sku && <div className="text-[11px] text-[#6B6B6B] font-mono">{p.sku}</div>}
                    </div>
                    {value === p.id && <HiCheck className="w-4 h-4 text-[#C4A882] flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
