import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiChevronLeft, HiChevronRight, HiOutlineHeart, HiHeart } from 'react-icons/hi2';
import { motion } from 'framer-motion';
import { useFavStore } from '../store/favStore';
import { useCurrencyStore, formatPrice } from '../store/currencyStore';

interface Product {
  id: number;
  slug: string;
  nameRu: string;
  nameEn: string;
  priceByn: number | string;
  priceUsd: number | string;
  priceRub?: number | string;
  images: string[];
  isNew?: boolean;
  labels?: string[];
  inStock: boolean;
}

interface Props {
  products: Product[];
}

const labelStyles: Record<string, string> = {
  NEW: 'bg-[#1A1A1A] text-white',
  SALE: 'bg-red-500 text-white',
  HIT: 'bg-[#C4A882] text-white',
};
function getLabelStyle(l: string) {
  if (l.startsWith('-') && l.endsWith('%')) return 'bg-red-500 text-white';
  return labelStyles[l] || 'bg-[#6B6B6B] text-white';
}

export default function ProductCarousel({ products }: Props) {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const { toggleItem, isFavorite } = useFavStore();
  const { currency } = useCurrencyStore();

  const [active, setActive] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const total = products.length;
  const go = (dir: -1 | 1) => setActive((i) => (i + dir + total) % total);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  if (!total) return null;

  const getOffset = (i: number) => {
    let d = i - active;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="relative h-[540px] sm:h-[600px] md:h-[680px] flex items-center justify-center select-none"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; }}
        onTouchMove={(e) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; }}
        onTouchEnd={() => {
          const threshold = 50;
          if (touchDeltaX.current < -threshold) go(1);
          else if (touchDeltaX.current > threshold) go(-1);
        }}
      >
        {products.map((product, i) => {
          const offset = getOffset(i);
          const abs = Math.abs(offset);
          if (abs > 2) return null;

          const name = isRu ? product.nameRu : product.nameEn;
          const price = formatPrice(product.priceByn, product.priceUsd, product.priceRub || 0, currency);
          const image = product.images[0];
          const labels = product.labels?.length ? product.labels : (product.isNew ? ['NEW'] : []);
          const fav = isFavorite(product.id);

          // Layout: shift in percent relative to container
          const translatePct = offset * 55; // 55% between slides
          const scale = abs === 0 ? 1 : abs === 1 ? 0.78 : 0.62;
          const opacity = abs === 0 ? 1 : abs === 1 ? 0.55 : 0.25;
          const z = 10 - abs;
          const blur = abs === 0 ? 0 : abs === 1 ? 1 : 3;

          return (
            <motion.div
              key={product.id}
              animate={{
                x: `${translatePct}%`,
                scale,
                opacity,
                filter: `blur(${blur}px)`,
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 0.9 }}
              style={{ zIndex: z }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[78%] sm:w-[62%] md:w-[44%] lg:w-[36%] max-w-sm"
              onClick={() => abs !== 0 && setActive(i)}
            >
              <div className={`bg-white rounded-[28px] overflow-hidden shadow-[0_20px_60px_-20px_rgba(26,26,26,0.25)] ${abs === 0 ? '' : 'cursor-pointer'}`}>
                <Link
                  to={`/product/${product.slug}`}
                  onClick={(e) => { if (abs !== 0) e.preventDefault(); }}
                  className="block relative aspect-[3/4] bg-[#F5F0EB] overflow-hidden"
                >
                  {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover" draggable={false} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#C4A882] text-7xl font-display">LS</div>
                  )}

                  {/* Labels */}
                  {labels.length > 0 && (
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                      {labels.map((label) => (
                        <span key={label} className={`text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${getLabelStyle(label)}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {!product.inStock && (
                    <span className="absolute top-4 right-4 bg-white/90 text-[#6B6B6B] text-[10px] font-medium px-2.5 py-1 rounded-full">
                      {t('catalog.out_of_stock')}
                    </span>
                  )}

                  {/* Bottom gradient with info (only on active card for clean side cards) */}
                  {abs === 0 && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5">
                      <p className="text-white/80 text-xs uppercase tracking-[0.2em] mb-1">
                        {t('home.new_arrivals')}
                      </p>
                      <h3 className="font-display text-white text-2xl md:text-3xl font-semibold leading-tight mb-1">
                        {name}
                      </h3>
                      <p className="text-white text-lg font-medium">{price}</p>
                    </div>
                  )}
                </Link>

                {/* Favorite on active card */}
                {abs === 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItem({
                        productId: product.id,
                        slug: product.slug,
                        nameRu: product.nameRu,
                        nameEn: product.nameEn,
                        priceByn: Number(product.priceByn),
                        priceUsd: Number(product.priceUsd),
                        image: product.images[0],
                      });
                    }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm z-10"
                  >
                    {fav ? <HiHeart className="w-5 h-5 text-[#C4A882]" /> : <HiOutlineHeart className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Arrow buttons */}
        {total > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:scale-105 transition-all flex items-center justify-center"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:scale-105 transition-all flex items-center justify-center"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Indicator dots */}
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-2 md:mt-4">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`transition-all rounded-full ${
                i === active ? 'w-8 h-2 bg-[#C4A882]' : 'w-2 h-2 bg-[#E5E5E3] hover:bg-[#C4A882]/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
