import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

function getPageItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const visible = new Set<number>();
  visible.add(1);
  visible.add(total);
  visible.add(current);
  visible.add(current - 1);
  visible.add(current + 1);

  if (current <= 3) {
    visible.add(2);
    visible.add(3);
  }
  if (current >= total - 2) {
    visible.add(total - 2);
    visible.add(total - 1);
  }

  const nums = [...visible].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const items: Array<number | 'ellipsis'> = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) items.push('ellipsis');
    items.push(nums[i]);
  }
  return items;
}

interface Props {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ current, total, onChange }: Props) {
  if (total <= 1) return null;

  const items = getPageItems(current, total);
  const btn =
    'w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors shrink-0';

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 sm:gap-1.5 mt-10 flex-nowrap"
    >
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
        className={`${btn} border border-[#E5E5E3] text-[#6B6B6B] hover:border-[#C4A882] disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <HiChevronLeft className="w-4 h-4" />
      </button>

      {items.map((item, i) =>
        item === 'ellipsis' ? (
          <span
            key={`e-${i}`}
            className="w-5 sm:w-6 h-8 sm:h-9 flex items-center justify-center text-sm text-[#9B9B9B] shrink-0 select-none"
          >
            …
          </span>
        ) : (
          <button
            type="button"
            key={item}
            onClick={() => onChange(item)}
            aria-current={current === item ? 'page' : undefined}
            className={`${btn} ${
              current === item
                ? 'bg-[#1A1A1A] text-white'
                : 'border border-[#E5E5E3] hover:border-[#C4A882] text-[#1A1A1A]'
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label="Next page"
        className={`${btn} border border-[#E5E5E3] text-[#6B6B6B] hover:border-[#C4A882] disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <HiChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
