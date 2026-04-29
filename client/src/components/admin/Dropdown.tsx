import { useState, useRef, useEffect } from 'react';
import { HiChevronDown, HiOutlinePlus, HiCheck } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface Props {
  value: string | number | '';
  onChange: (value: string | number) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  extraAction?: {
    label: string;
    onClick: () => void;
    isActive?: boolean;
  };
  disabled?: boolean;
  className?: string;
}

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  required,
  extraAction,
  disabled,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isExtraActive = extraAction?.isActive;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl px-3.5 py-2.5 text-sm transition-colors bg-white ${
          open ? 'border-[#C4A882]' : 'border-[#E5E5E3] hover:border-[#C4A882]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={selected || isExtraActive ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'}>
          {isExtraActive ? extraAction?.label : selected ? selected.label : placeholder}
        </span>
        <HiChevronDown className={`w-4 h-4 text-[#6B6B6B] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Hidden real input for form validation — satisfied if selected or extraAction is active */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          value={isExtraActive ? 'pending' : (value || '')}
          onChange={() => {}}
          required
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-[#E5E5E3] overflow-hidden max-h-72 overflow-y-auto"
          >
            <div className="py-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-left transition-colors ${
                    value === opt.value && !isExtraActive
                      ? 'bg-[#F5F0EB] text-[#1A1A1A] font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && !isExtraActive && <HiCheck className="w-4 h-4 text-[#C4A882]" />}
                </button>
              ))}

              {extraAction && (
                <>
                  {options.length > 0 && <div className="h-px bg-[#E5E5E3] my-1" />}
                  <button
                    type="button"
                    onClick={() => { extraAction.onClick(); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left transition-colors ${
                      isExtraActive ? 'bg-[#F5F0EB] text-[#C4A882] font-medium' : 'text-[#C4A882] hover:bg-[#F5F0EB]'
                    }`}
                  >
                    <HiOutlinePlus className="w-4 h-4" />
                    {extraAction.label}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
