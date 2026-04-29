import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';
import { useCurrencyStore, formatPrice } from '../store/currencyStore';
import api from '../api/client';

export default function SearchBar() {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const navigate = useNavigate();
  const { currency } = useCurrencyStore();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions on query change
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/products', { params: { search: query, limit: 5 } });
        setSuggestions(res.data.products || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <form onSubmit={handleSubmit} className="flex items-center">
        {/* Desktop search */}
        <div className="flex items-center border border-[#E5E5E3] rounded-full px-3 py-1.5 focus-within:border-[#C4A882] transition-colors">
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-[#6B6B6B] mr-2 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={t('search.placeholder')}
            className="text-sm bg-transparent outline-none w-40 lg:w-52"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setSuggestions([]); }} className="ml-1">
              <HiOutlineXMark className="w-4 h-4 text-[#6B6B6B]" />
            </button>
          )}
        </div>
      </form>

      {/* Desktop dropdown suggestions */}
      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-[#E5E5E3] overflow-hidden z-50 min-w-[300px]">
          {loading && <p className="text-xs text-[#6B6B6B] p-3">...</p>}
          {!loading && suggestions.length === 0 && (
            <p className="text-sm text-[#6B6B6B] p-4">{t('search.no_results')}</p>
          )}
          {suggestions.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.slug}`}
              onClick={() => { setOpen(false); setQuery(''); }}
              className="flex items-center gap-3 p-3 hover:bg-[#F5F0EB] transition-colors"
            >
              <div className="w-10 h-12 rounded bg-[#F5F0EB] flex-shrink-0 overflow-hidden">
                {p.images[0] ? (
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C4A882] text-xs font-display">LS</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{isRu ? p.nameRu : p.nameEn}</p>
                <p className="text-xs text-[#6B6B6B]">{formatPrice(p.priceByn, p.priceUsd, p.priceRub || 0, currency)}</p>
              </div>
            </Link>
          ))}
          {suggestions.length > 0 && (
            <button
              onClick={() => { navigate(`/search?q=${encodeURIComponent(query)}`); setOpen(false); }}
              className="w-full text-center text-sm text-[#C4A882] py-3 border-t border-[#E5E5E3] hover:bg-[#F5F0EB] transition-colors"
            >
              {t('search.view_all')} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
