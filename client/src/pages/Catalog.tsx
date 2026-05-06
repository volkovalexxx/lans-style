import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiChevronDown, HiXMark, HiAdjustmentsHorizontal, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { useApi } from '../hooks/useApi';
import { useCurrencyStore } from '../store/currencyStore';

interface FilterData {
  sizes: string[];
  colors: Array<{ hex: string; name: string }>;
  labels: string[];
  priceMin: number;
  priceMax: number;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function FilterDropdown({ label, active, count, children }: {
  label: string;
  active: boolean;
  count?: number;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
          active
            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
            : 'bg-white border-[#E5E5E3] hover:border-[#C4A882] text-[#1A1A1A]'
        }`}
      >
        {label}
        {count !== undefined && count > 0 && (
          <span className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${
            active ? 'bg-white/20 text-white' : 'bg-[#C4A882] text-white'
          }`}>
            {count}
          </span>
        )}
        <HiChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-40 bg-white rounded-2xl shadow-xl border border-[#E5E5E3] overflow-hidden min-w-[240px]"
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Catalog() {
  const { t, i18n } = useTranslation();
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const isRu = i18n.language === 'ru';
  const { currency } = useCurrencyStore();
  const currencySymbol = currency === 'USD' ? '$' : currency === 'RUB' ? '₽' : 'BYN';

  const [activeCategorySlug, setActiveCategorySlug] = useState<string | undefined>(categorySlug);
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [page, setPage] = useState(1);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => { setActiveCategorySlug(categorySlug); }, [categorySlug]);

  const { data: categories } = useApi<any[]>('/categories');
  const { data: filterData } = useApi<FilterData>('/products/filters',
    activeCategorySlug ? { categoryId: categories?.find((c: any) => c.slug === activeCategorySlug)?.id } : undefined
  );

  const selectedCategory = useMemo(
    () => categories?.find((c: any) => c.slug === activeCategorySlug),
    [categories, activeCategorySlug]
  );

  // Build query params; useApi will serialize arrays as repeated keys: ?size=42&size=44
  const params: Record<string, any> = { page: String(page), limit: '12' };
  if (selectedCategory) params.categoryId = String(selectedCategory.id);
  if (sort) params.sort = sort;
  if (searchParams.get('isNew')) params.isNew = 'true';
  if (selectedSizes.length) params.size = selectedSizes;
  if (selectedColors.length) params.color = selectedColors;
  if (priceFrom) params.priceMin = priceFrom;
  if (priceTo) params.priceMax = priceTo;

  const { data, loading } = useApi<{ products: any[]; total: number; pages: number }>(
    '/products',
    params
  );

  const filteredProducts = data?.products ?? [];

  useEffect(() => { setPage(1); }, [activeCategorySlug, sort, selectedSizes, selectedColors, priceFrom, priceTo]);

  const selectCategory = (slug?: string) => {
    setActiveCategorySlug(slug);
    const url = slug ? `/catalog/${slug}` : '/catalog';
    window.history.replaceState(null, '', url);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (raw: string) => {
    setSelectedColors((prev) =>
      prev.includes(raw) ? prev.filter((c) => c !== raw) : [...prev, raw]
    );
  };

  const resetFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceFrom('');
    setPriceTo('');
    setSort('');
    setPage(1);
  };

  const hasActiveFilters = selectedSizes.length > 0 || selectedColors.length > 0 || !!priceFrom || !!priceTo || !!sort;

  const [catDropOpen, setCatDropOpen] = useState(false);
  const catDropRef = useRef<HTMLDivElement>(null);
  useClickOutside(catDropRef, () => setCatDropOpen(false));

  const sortRef = useRef<HTMLDivElement>(null);
  const [sortOpen, setSortOpen] = useState(false);
  useClickOutside(sortRef, () => setSortOpen(false));

  const sortOptions = [
    { value: '', label: t('catalog.sort_new') },
    { value: 'price_asc', label: t('catalog.sort_price_asc') },
    { value: 'price_desc', label: t('catalog.sort_price_desc') },
    { value: 'name', label: t('catalog.sort_name') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            {selectedCategory ? (isRu ? selectedCategory.nameRu : selectedCategory.nameEn) : t('catalog.title')}
          </h1>
          {data && (
            <p className="text-sm text-[#6B6B6B] mt-1">
              {data.total} {data.total === 1 ? (isRu ? 'товар' : 'product') : (isRu ? 'товаров' : 'products')}
            </p>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#E5E5E3] bg-white"
        >
          <HiAdjustmentsHorizontal className="w-4 h-4" />
          {t('catalog.filters')}
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[#C4A882]" />
          )}
        </button>
      </div>

      {/* Category pills — desktop */}
      <div className="hidden md:flex gap-2 pb-4 mb-6 flex-wrap">
        <button
          onClick={() => selectCategory(undefined)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
            !activeCategorySlug ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white border-[#E5E5E3] hover:border-[#C4A882]'
          }`}
        >
          {t('catalog.all_categories')}
        </button>
        {categories?.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => selectCategory(cat.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
              activeCategorySlug === cat.slug
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-white border-[#E5E5E3] hover:border-[#C4A882]'
            }`}
          >
            {isRu ? cat.nameRu : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Category dropdown — mobile only */}
      <div ref={catDropRef} className="md:hidden relative mb-5">
        <button
          onClick={() => setCatDropOpen(!catDropOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-[#E5E5E3] text-sm font-medium"
        >
          <span className="text-[#1A1A1A]">
            {activeCategorySlug
              ? (isRu ? selectedCategory?.nameRu : selectedCategory?.nameEn) ?? t('catalog.all_categories')
              : t('catalog.all_categories')}
          </span>
          <HiChevronDown className={`w-4 h-4 text-[#6B6B6B] transition-transform duration-200 ${catDropOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {catDropOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-[#E5E5E3] overflow-hidden"
            >
              <button
                onClick={() => { selectCategory(undefined); setCatDropOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors ${
                  !activeCategorySlug ? 'bg-[#F5F0EB] font-semibold text-[#1A1A1A]' : 'hover:bg-[#FAFAF8] text-[#1A1A1A]'
                }`}
              >
                <span>{t('catalog.all_categories')}</span>
                {!activeCategorySlug && <span className="w-2 h-2 rounded-full bg-[#C4A882]" />}
              </button>
              <div className="border-t border-[#F0EDE8]" />
              {categories?.map((cat: any, idx: number) => (
                <div key={cat.id}>
                  <button
                    onClick={() => { selectCategory(cat.slug); setCatDropOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors ${
                      activeCategorySlug === cat.slug
                        ? 'bg-[#F5F0EB] font-semibold text-[#1A1A1A]'
                        : 'hover:bg-[#FAFAF8] text-[#1A1A1A]'
                    }`}
                  >
                    <span>{isRu ? cat.nameRu : cat.nameEn}</span>
                    {activeCategorySlug === cat.slug
                      ? <span className="w-2 h-2 rounded-full bg-[#C4A882]" />
                      : <span className="text-xs text-[#9B9B9B]">{cat._count?.products}</span>
                    }
                  </button>
                  {idx < (categories?.length ?? 0) - 1 && <div className="border-t border-[#F0EDE8] mx-4" />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop filters row */}
      <div className="hidden md:flex items-center gap-3 mb-8">
        {/* Size filter */}
        {filterData && filterData.sizes.length > 0 && (
          <FilterDropdown
            label={t('catalog.size')}
            active={selectedSizes.length > 0}
            count={selectedSizes.length}
          >
            {(close) => (
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {filterData.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`min-w-[44px] h-10 px-3 rounded-lg text-sm font-medium border transition-all ${
                        selectedSizes.includes(size)
                          ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                          : 'border-[#E5E5E3] hover:border-[#C4A882]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedSizes.length > 0 && (
                  <button
                    onClick={() => { setSelectedSizes([]); close(); }}
                    className="mt-3 text-xs text-[#C4A882] hover:underline"
                  >
                    {t('catalog.reset')}
                  </button>
                )}
              </div>
            )}
          </FilterDropdown>
        )}

        {/* Color filter */}
        {filterData && filterData.colors.length > 0 && (
          <FilterDropdown
            label={t('catalog.color')}
            active={selectedColors.length > 0}
            count={selectedColors.length}
          >
            {(close) => (
              <div className="p-4 max-h-[300px] overflow-y-auto">
                <div className="space-y-0.5">
                  {filterData.colors.map((color) => {
                    const raw = JSON.stringify(color);
                    const active = selectedColors.includes(raw);
                    return (
                      <button
                        key={color.hex}
                        onClick={() => toggleColor(raw)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active ? 'bg-[#F5F0EB]' : 'hover:bg-gray-50'}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${active ? 'border-[#C4A882] scale-110' : 'border-[#E5E5E3]'}`}
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="flex-1 text-left">{color.name}</span>
                        {active && <span className="text-[#C4A882] text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
                {selectedColors.length > 0 && (
                  <button
                    onClick={() => { setSelectedColors([]); close(); }}
                    className="mt-3 text-xs text-[#C4A882] hover:underline"
                  >
                    {t('catalog.reset')}
                  </button>
                )}
              </div>
            )}
          </FilterDropdown>
        )}

        {/* Price filter */}
        {filterData && filterData.priceMax > 0 && (
          <FilterDropdown
            label={t('catalog.price')}
            active={!!(priceFrom || priceTo)}
          >
            {(close) => (
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1 block">{t('catalog.price_from')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={priceFrom}
                        onChange={(e) => setPriceFrom(e.target.value)}
                        placeholder={String(Math.floor(filterData.priceMin))}
                        className="w-full border border-[#E5E5E3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882] pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B]">{currencySymbol}</span>
                    </div>
                  </div>
                  <span className="text-[#6B6B6B] mt-5">—</span>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1 block">{t('catalog.price_to')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={priceTo}
                        onChange={(e) => setPriceTo(e.target.value)}
                        placeholder={String(Math.ceil(filterData.priceMax))}
                        className="w-full border border-[#E5E5E3] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882] pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B]">{currencySymbol}</span>
                    </div>
                  </div>
                </div>
                {(priceFrom || priceTo) && (
                  <button
                    onClick={() => { setPriceFrom(''); setPriceTo(''); close(); }}
                    className="mt-3 text-xs text-[#C4A882] hover:underline"
                  >
                    {t('catalog.reset')}
                  </button>
                )}
              </div>
            )}
          </FilterDropdown>
        )}

        {/* Sort dropdown */}
        <div ref={sortRef} className="relative ml-auto">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#E5E5E3] bg-white hover:border-[#C4A882] transition-all"
          >
            {t('catalog.sort')}: {sortOptions.find((o) => o.value === sort)?.label}
            <HiChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 z-40 bg-white rounded-2xl shadow-xl border border-[#E5E5E3] overflow-hidden min-w-[220px]"
              >
                <div className="py-1">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sort === opt.value ? 'bg-[#F5F0EB] text-[#1A1A1A] font-medium' : 'hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reset all filters */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-[#C4A882] hover:text-[#A68E6A] transition-colors"
          >
            <HiXMark className="w-4 h-4" />
            {t('catalog.reset')}
          </button>
        )}
      </div>

      {/* Mobile filters panel */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden mb-6"
          >
            <div className="bg-white rounded-2xl p-5 space-y-5 border border-[#E5E5E3]">
              {/* Size */}
              {filterData && filterData.sizes.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2.5">{t('catalog.size')}</p>
                  <div className="flex flex-wrap gap-2">
                    {filterData.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`min-w-[44px] h-10 px-3 rounded-lg text-sm font-medium border transition-all ${
                          selectedSizes.includes(size)
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                            : 'border-[#E5E5E3] hover:border-[#C4A882]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color */}
              {filterData && filterData.colors.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2.5">{t('catalog.color')}</p>
                  <div className="flex flex-wrap gap-2">
                    {filterData.colors.map((color) => {
                      const raw = JSON.stringify(color);
                      const active = selectedColors.includes(raw);
                      return (
                        <button
                          key={color.hex}
                          onClick={() => toggleColor(raw)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                            active ? 'border-[#C4A882] bg-[#F5F0EB]' : 'border-[#E5E5E3] hover:border-[#C4A882]'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full border border-[#E5E5E3] flex-shrink-0" style={{ backgroundColor: color.hex }} />
                          {color.name}
                          {active && <span className="text-[#C4A882] text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price */}
              {filterData && filterData.priceMax > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2.5">{t('catalog.price')}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={priceFrom}
                        onChange={(e) => setPriceFrom(e.target.value)}
                        placeholder={String(Math.floor(filterData.priceMin))}
                        className="w-full border border-[#E5E5E3] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B]">{currencySymbol}</span>
                    </div>
                    <span className="text-[#6B6B6B]">—</span>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={priceTo}
                        onChange={(e) => setPriceTo(e.target.value)}
                        placeholder={String(Math.ceil(filterData.priceMax))}
                        className="w-full border border-[#E5E5E3] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B]">{currencySymbol}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sort */}
              <div>
                <p className="text-sm font-medium mb-2.5">{t('catalog.sort')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSort(opt.value)}
                      className={`px-3 py-2.5 rounded-lg text-sm border transition-all ${
                        sort === opt.value
                          ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                          : 'border-[#E5E5E3] hover:border-[#C4A882]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 bg-[#1A1A1A] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
                >
                  {t('catalog.apply')} {data ? `(${data.total})` : ''}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="px-4 py-3 rounded-xl text-sm font-medium border border-[#E5E5E3] hover:bg-gray-50 transition-colors"
                  >
                    {t('catalog.reset')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          {selectedSizes.map((size) => (
            <FilterChip key={size} onRemove={() => toggleSize(size)}>
              {t('catalog.size')}: {size}
            </FilterChip>
          ))}
          {selectedColors.map((raw) => {
            try {
              const c = JSON.parse(raw);
              return (
                <FilterChip key={raw} onRemove={() => toggleColor(raw)}>
                  <span className="w-3.5 h-3.5 rounded-full border border-[#D4BC9A] flex-shrink-0" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </FilterChip>
              );
            } catch { return null; }
          })}
          {(priceFrom || priceTo) && (
            <FilterChip onRemove={() => { setPriceFrom(''); setPriceTo(''); }}>
              {priceFrom || '0'} — {priceTo || '∞'} {currencySymbol}
            </FilterChip>
          )}
          {sort && (
            <FilterChip onRemove={() => setSort('')}>
              {sortOptions.find((o) => o.value === sort)?.label}
            </FilterChip>
          )}
          <button
            onClick={resetFilters}
            className="text-xs text-[#9B9B9B] hover:text-[#C4A882] underline underline-offset-2 transition-colors ml-1"
          >
            {t('catalog.reset')}
          </button>
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-2xl bg-[#E5E5E3]" />
              <div className="mt-3 h-4 bg-[#E5E5E3] rounded w-3/4" />
              <div className="mt-2 h-4 bg-[#E5E5E3] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <Pagination current={page} total={data.pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-[#6B6B6B] text-lg">{t('catalog.no_products')}</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 text-[#C4A882] hover:underline text-sm"
            >
              {t('catalog.reset')} {t('catalog.filters').toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F0EB] border border-[#E0D5C5] text-sm text-[#1A1A1A] font-medium">
      {children}
      <button
        onClick={onRemove}
        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#D4BC9A]/40 transition-colors flex-shrink-0"
        aria-label="Убрать фильтр"
      >
        <HiXMark className="w-3 h-3" />
      </button>
    </span>
  );
}

function getPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [];
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
  add(1);
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) add(i);
  if (current < total - 2) pages.push('...');
  add(total);
  return pages;
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  const pages = getPages(current, total);
  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E5E5E3] text-[#6B6B6B] hover:border-[#C4A882] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <HiChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-[#9B9B9B]">
            ···
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
              current === p
                ? 'bg-[#1A1A1A] text-white'
                : 'border border-[#E5E5E3] hover:border-[#C4A882] text-[#1A1A1A]'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E5E5E3] text-[#6B6B6B] hover:border-[#C4A882] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <HiChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
