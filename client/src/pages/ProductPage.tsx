import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineHeart, HiHeart, HiArrowLeft, HiChevronLeft, HiChevronRight, HiOutlineInformationCircle } from 'react-icons/hi2';
import SizeGuideModal from '../components/SizeGuideModal';
import ImageLightbox from '../components/ImageLightbox';
import { useApi } from '../hooks/useApi';
import { useCartStore } from '../store/cartStore';
import { useFavStore } from '../store/favStore';
import { useCurrencyStore, formatPrice } from '../store/currencyStore';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const { addItem } = useCartStore();
  const { toggleItem, isFavorite } = useFavStore();
  const { currency } = useCurrencyStore();

  const { data: product, loading } = useApi<any>(`/products/${slug}`);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [added, setAdded] = useState(false);
  const [swipeDir, setSwipeDir] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedImage]);

  if (loading) return <div className="text-center py-20">...</div>;
  if (!product) return <div className="text-center py-20">{t('catalog.no_products')}</div>;

  const name = isRu ? product.nameRu : product.nameEn;
  const desc = isRu ? product.descRu : product.descEn;
  const price = formatPrice(product.priceByn, product.priceUsd, product.priceRub || 0, currency);
  const fav = isFavorite(product.id);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      nameRu: product.nameRu,
      nameEn: product.nameEn,
      priceByn: Number(product.priceByn),
      priceUsd: Number(product.priceUsd),
      priceRub: Number(product.priceRub || 0),
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#C4A882] mb-6 transition-colors">
        <HiArrowLeft className="w-4 h-4" /> {t('product.back')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          <div
            className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#F5F0EB] mb-4 group"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              touchDeltaX.current = 0;
            }}
            onTouchMove={(e) => {
              touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
            }}
            onTouchEnd={() => {
              const threshold = 50;
              if (touchDeltaX.current < -threshold && selectedImage < product.images.length - 1) {
                setSwipeDir(1);
                setSelectedImage(selectedImage + 1);
              } else if (touchDeltaX.current > threshold && selectedImage > 0) {
                setSwipeDir(-1);
                setSelectedImage(selectedImage - 1);
              }
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0, x: swipeDir * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -swipeDir * 100 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                {product.images[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={name}
                    onClick={() => setLightboxOpen(true)}
                    className="w-full h-full object-cover cursor-zoom-in"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C4A882] text-8xl font-display">
                    LS
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Desktop arrows */}
            {product.images.length > 1 && (
              <>
                {selectedImage > 0 && (
                  <button
                    onClick={() => { setSwipeDir(-1); setSelectedImage(selectedImage - 1); }}
                    className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                  >
                    <HiChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {selectedImage < product.images.length - 1 && (
                  <button
                    onClick={() => { setSwipeDir(1); setSelectedImage(selectedImage + 1); }}
                    className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                  >
                    <HiChevronRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

          </div>

          {/* Thumbnail slider (mobile + desktop) */}
          {product.images.length > 1 && (
            <div className="relative mt-2">
              <div
                ref={thumbsRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              >
                {product.images.map((img: string, i: number) => {
                  const active = i === selectedImage;
                  return (
                    <button
                      key={i}
                      ref={active ? activeThumbRef : null}
                      onClick={() => { setSwipeDir(i > selectedImage ? 1 : -1); setSelectedImage(i); }}
                      className={`relative flex-shrink-0 snap-start rounded-xl overflow-hidden transition-all duration-200 w-16 h-20 md:w-20 md:h-24 ring-inset ${
                        active
                          ? 'ring-[3px] ring-[#C4A882] shadow-md'
                          : 'opacity-60 hover:opacity-100 ring-1 ring-[#E5E5E3]'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                      {!active && (
                        <span className="absolute inset-0 bg-white/20 hover:bg-transparent transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Edge fade gradients when scrollable */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#FAFAF8] to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#FAFAF8] to-transparent" />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              {product.category && (
                <Link
                  to={`/catalog/${product.category.slug}`}
                  className="text-sm text-[#C4A882] hover:underline"
                >
                  {isRu ? product.category.nameRu : product.category.nameEn}
                </Link>
              )}
              <h1 className="font-display text-2xl md:text-3xl font-semibold mt-1">
                {name}
              </h1>
              {product.labels?.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {product.labels.map((label: string) => {
                    const style = label === 'SALE' ? 'bg-red-500 text-white'
                      : label === 'HIT' ? 'bg-[#C4A882] text-white'
                      : label.startsWith('-') ? 'bg-red-500 text-white'
                      : 'bg-[#1A1A1A] text-white';
                    return (
                      <span key={label} className={`text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${style}`}>
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={() => toggleItem({
                productId: product.id,
                slug: product.slug,
                nameRu: product.nameRu,
                nameEn: product.nameEn,
                priceByn: Number(product.priceByn),
                priceUsd: Number(product.priceUsd),
                image: product.images[0],
              })}
              className="p-2 hover:text-[#C4A882] transition-colors"
            >
              {fav ? <HiHeart className="w-6 h-6 text-[#C4A882]" /> : <HiOutlineHeart className="w-6 h-6" />}
            </button>
          </div>

          <p className="text-2xl font-semibold mb-6">{price}</p>

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{t('product.size')}</p>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="flex items-center gap-1 text-xs text-[#C4A882] hover:text-[#A68E6A] transition-colors font-medium group"
                >
                  <HiOutlineInformationCircle className="w-4 h-4" />
                  <span className="border-b border-dashed border-[#C4A882] group-hover:border-[#A68E6A]">
                    {isRu ? 'Узнать размер' : 'Size guide'}
                  </span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      selectedSize === size
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

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">{t('product.color')}</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((raw: string) => {
                  let hex = raw, name = '';
                  try { const p = JSON.parse(raw); hex = p.hex; name = p.name; } catch {}
                  return (
                    <button
                      key={raw}
                      onClick={() => setSelectedColor(raw)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                        selectedColor === raw ? 'border-[#C4A882] bg-[#F5F0EB]' : 'border-[#E5E5E3] hover:border-[#C4A882]'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full border border-[#E5E5E3] flex-shrink-0" style={{ backgroundColor: hex }} />
                      {name && <span className="text-xs">{name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className={`w-full py-3.5 rounded-xl text-sm font-medium transition-colors ${
              added
                ? 'bg-green-600 text-white'
                : product.inStock
                  ? 'bg-[#1A1A1A] text-white hover:bg-[#333]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {added ? t('product.added') + ' ✓' : product.inStock ? t('product.add_to_cart') : t('catalog.out_of_stock')}
          </button>

          {/* Description */}
          {desc && (
            <div className="mt-8 pt-8 border-t border-[#E5E5E3]">
              <h3 className="font-medium mb-3">{t('product.description')}</h3>
              <p className="text-[#6B6B6B] leading-relaxed">{desc}</p>
            </div>
          )}
        </div>
      </div>

      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
      <ImageLightbox
        open={lightboxOpen}
        images={product.images || []}
        index={selectedImage}
        onChange={setSelectedImage}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
