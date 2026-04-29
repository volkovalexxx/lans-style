import { useEffect } from 'react';
import { HiXMark } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
}

const sizeData = {
  rus: [40, 42, 44, 46, 48, 50, 52, 54],
  bust: [80, 84, 88, 92, 96, 100, 104, 108],
  waist: [60, 64, 68, 74, 78, 82, 86, 90],
  hips: [88, 92, 96, 100, 104, 108, 112, 116],
  height: [170, 170, 170, 170, 170, 170, 170, 170],
  int: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
};

export default function SizeGuideModal({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const labels = isRu
    ? {
        title: 'Размерная сетка',
        subtitle: 'Подберите свой размер по параметрам фигуры',
        rus: 'Российский',
        int: 'Международный',
        bust: 'Обхват груди',
        waist: 'Обхват талии',
        hips: 'Обхват бёдер',
        height: 'Рост',
        cm: 'см',
        help: 'Если параметры попадают между двумя размерами — рекомендуем выбрать больший.',
      }
    : {
        title: 'Size Guide',
        subtitle: 'Find your size by body measurements',
        rus: 'Russian',
        int: 'International',
        bust: 'Bust',
        waist: 'Waist',
        hips: 'Hips',
        height: 'Height',
        cm: 'cm',
        help: 'If your measurements fall between two sizes, we recommend choosing the larger one.',
      };

  const rows: Array<{ label: string; values: (string | number)[]; unit?: string; highlight?: boolean }> = [
    { label: labels.int, values: sizeData.int, highlight: true },
    { label: labels.rus, values: sizeData.rus },
    { label: labels.bust, values: sizeData.bust, unit: labels.cm },
    { label: labels.waist, values: sizeData.waist, unit: labels.cm },
    { label: labels.hips, values: sizeData.hips, unit: labels.cm },
    { label: labels.height, values: sizeData.height, unit: labels.cm },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full md:max-w-4xl max-h-[90vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col mx-0 md:mx-4"
          >
            {/* Header */}
            <div className="relative px-6 md:px-8 pt-6 pb-5 border-b border-[#E5E5E3] bg-gradient-to-br from-[#FAFAF8] to-[#F5F0EB]">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white border border-[#E5E5E3] transition-colors"
              >
                <HiXMark className="w-5 h-5" />
              </button>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] pr-12">
                {labels.title}
              </h2>
              <p className="text-sm text-[#6B6B6B] mt-1">{labels.subtitle}</p>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-6 md:px-8 py-6">
              <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full border-separate border-spacing-0 min-w-[640px]">
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.label}>
                        <th className="sticky-label text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider py-3 pr-4 whitespace-nowrap border-b border-[#E5E5E3]">
                          {row.label}
                          {row.unit && <span className="text-[#C4A882] font-normal normal-case ml-1">({row.unit})</span>}
                        </th>
                        {row.values.map((v, j) => (
                          <td
                            key={j}
                            className={`text-center py-3 px-2 border-b border-[#E5E5E3] ${
                              row.highlight
                                ? 'font-semibold text-[#C4A882]'
                                : i === 0
                                  ? 'font-medium'
                                  : 'text-[#1A1A1A]'
                            }`}
                          >
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <style>{`
                .sticky-label {
                  position: sticky;
                  left: 0;
                  background: #ffffff;
                  z-index: 2;
                  box-shadow: 6px 0 8px -6px rgba(0, 0, 0, 0.08);
                }
              `}</style>

              {/* Help text */}
              <div className="mt-6 flex items-start gap-3 p-4 bg-[#F5F0EB] rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-[#C4A882] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                  i
                </div>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{labels.help}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
