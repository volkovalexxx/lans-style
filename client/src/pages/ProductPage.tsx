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

  // Costume-specific state
  const [selectedTopSize, setSelectedTopSize] = useState('');
  const [selectedTopColor, setSelectedTopColor] = useState('');
  const [selectedBottomSize, setSelectedBottomSize] = useState('');
  const [selectedBottomColor, setSelectedBottomColor] = useState('');
  const [extraSizes, setExtraSizes] = useState<string[]>(['', '', '']);
  const [addedTop, setAddedTop] = useState(false);
  const [addedBottom, setAddedBottom] = useState(false);
  const [addedSet, setAddedSet] = useState(false);

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

  const handleAddTopToCart = () => {
    const top = product.costumeTop;
    addItem({
      productId: top.id,
      slug: top.slug,
      nameRu: top.nameRu,
      nameEn: top.nameEn,
      priceByn: Number(top.priceByn),
      priceUsd: Number(top.priceUsd),
      priceRub: Number(top.priceRub || 0),
      image: top.images?.[0],
      size: selectedTopSize,
      color: selectedTopColor,
    });
    setAddedTop(true);
    setTimeout(() => setAddedTop(false), 2000);
  };

  const handleAddBottomToCart = () => {
    const bottom = product.costumeBottom;
    addItem({
      productId: bottom.id,
      slug: bottom.slug,
      nameRu: bottom.nameRu,
      nameEn: bottom.nameEn,
      priceByn: Number(bottom.priceByn),
      priceUsd: Number(bottom.priceUsd),
      priceRub: Number(bottom.priceRub || 0),
      image: bottom.images?.[0],
      size: selectedBottomSize,
      color: selectedBottomColor,
    });
    setAddedBottom(true);
    setTimeout(() => setAddedBottom(false), 2000);
  };

  const handleAddSetToCart = () => {
    handleAddTopToCart();
    handleAddBottomToCart();
    const extraItems = [product.costumeItem3, product.costumeItem4, product.costumeItem5].filter(Boolean);
    extraItems.forEach((item: any, idx: number) => {
      addItem({
        productId: item.id,
        slug: item.slug,
        nameRu: item.nameRu,
        nameEn: item.nameEn,
        priceByn: Number(item.priceByn),
        priceUsd: Number(item.priceUsd),
        priceRub: Number(item.priceRub || 0),
        image: item.images?.[0],
        size: extraSizes[idx],
      });
    });
    setAddedTop(false);
    setAddedBottom(false);
    setAddedSet(true);
    setTimeout(() => setAddedSet(false), 2500);
  };

  // Images to show in gallery: product's own, fallback to top+bottom first images
  const galleryImages = product.images?.length > 0
    ? product.images
    : [
        ...(product.costumeTop?.images?.slice(0, 1) || []),
        ...(product.costumeBottom?.images?.slice(0, 1) || []),
      ];

  const isCostume = product.isCostume && product.costumeTop && product.costumeBottom;
  const extraItems: any[] = isCostume
    ? [product.costumeItem3, product.costumeItem4, product.costumeItem5].filter(Boolean)
    : [];

  // Savings calculation for costume
  const costumeSetPrice = Number(product.priceByn);
  const topPrice = isCostume ? Number(product.costumeTop.priceByn) : 0;
  const bottomPrice = isCostume ? Number(product.costumeBottom.priceByn) : 0;
  const extraPartsPrice = extraItems.reduce((s: number, i: any) => s + Number(i.priceByn), 0);
  const extraPartsUsd = extraItems.reduce((s: number, i: any) => s + Number(i.priceUsd), 0);
  const sumParts = topPrice + bottomPrice + extraPartsPrice;
  const savings = sumParts > costumeSetPrice ? sumParts - costumeSetPrice : 0;
  const savingsPrice = isCostume
    ? formatPrice(savings, Number(product.costumeTop.priceUsd) + Number(product.costumeBottom.priceUsd) + extraPartsUsd - Number(product.priceUsd), 0, currency)
    : '';

  const GalleryBlock = ({ images }: { images: string[] }) => (
    <div>
      <div
        className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#F5F0EB] mb-4 group"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; }}
        onTouchMove={(e) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; }}
        onTouchEnd={() => {
          const threshold = 50;
          if (touchDeltaX.current < -threshold && selectedImage < images.length - 1) {
            setSwipeDir(1); setSelectedImage(selectedImage + 1);
          } else if (touchDeltaX.current > threshold && selectedImage > 0) {
            setSwipeDir(-1); setSelectedImage(selectedImage - 1);
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
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={name}
                onClick={() => setLightboxOpen(true)}
                className="w-full h-full object-cover cursor-zoom-in"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#C4A882] text-8xl font-display">LS</div>
            )}
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            {selectedImage > 0 && (
              <button
                onClick={() => { setSwipeDir(-1); setSelectedImage(selectedImage - 1); }}
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
              >
                <HiChevronLeft className="w-4 h-4" />
              </button>
            )}
            {selectedImage < images.length - 1 && (
              <button
                onClick={() => { setSwipeDir(1); setSelectedImage(selectedImage + 1); }}
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
              >
                <HiChevronRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        {isCostume && (
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider bg-[#7C5C9A] text-white">
              {t('product.costume_label')}
            </span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="relative mt-2">
          <div ref={thumbsRef} className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {images.map((img: string, i: number) => {
              const active = i === selectedImage;
              return (
                <button
                  key={i}
                  ref={active ? activeThumbRef : null}
                  onClick={() => { setSwipeDir(i > selectedImage ? 1 : -1); setSelectedImage(i); }}
                  className={`relative flex-shrink-0 snap-start rounded-xl overflow-hidden transition-all duration-200 w-16 h-20 md:w-20 md:h-24 ring-inset ${
                    active ? 'ring-[3px] ring-[#C4A882] shadow-md' : 'opacity-60 hover:opacity-100 ring-1 ring-[#E5E5E3]'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                  {!active && <span className="absolute inset-0 bg-white/20 hover:bg-transparent transition-colors" />}
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#FAFAF8] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#FAFAF8] to-transparent" />
        </div>
      )}
    </div>
  );

  const ColorSelector = ({
    colors,
    selected,
    onSelect,
  }: {
    colors: string[];
    selected: string;
    onSelect: (c: string) => void;
  }) => (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((raw: string) => {
        let hex = raw, cname = '';
        try { const p = JSON.parse(raw); hex = p.hex; cname = p.name; } catch {}
        return (
          <button
            key={raw}
            onClick={() => onSelect(raw)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs ${
              selected === raw ? 'border-[#C4A882] bg-[#F5F0EB]' : 'border-[#E5E5E3] hover:border-[#C4A882]'
            }`}
          >
            <span className="w-4 h-4 rounded-full border border-[#E5E5E3] flex-shrink-0" style={{ backgroundColor: hex }} />
            {cname && <span>{cname}</span>}
          </button>
        );
      })}
    </div>
  );

  if (isCostume) {
    const top = product.costumeTop;
    const bottom = product.costumeBottom;
    const topName = isRu ? top.nameRu : top.nameEn;
    const bottomName = isRu ? bottom.nameRu : bottom.nameEn;
    const topPriceFmt = formatPrice(top.priceByn, top.priceUsd, top.priceRub || 0, currency);
    const bottomPriceFmt = formatPrice(bottom.priceByn, bottom.priceUsd, bottom.priceRub || 0, currency);
    const slotLabel = (n: number) => (product[`costumeLabel${n}`] as string | null) || `Позиция ${n}`;

    // Piece preview block component
    const PieceCard = ({
      piece, pieceName, piecePrice, label,
    }: { piece: any; pieceName: string; piecePrice: string; label: string }) => (
      <Link
        to={`/product/${piece.slug}`}
        className="flex items-center gap-3 p-3 rounded-2xl border border-[#E5E5E3] bg-white hover:border-[#C4A882] hover:shadow-sm transition-all group"
      >
        <div className="relative flex-shrink-0 w-14 h-[4.5rem] rounded-xl overflow-hidden bg-[#F5F0EB]">
          {piece.images?.[0] ? (
            <img src={piece.images[0]} alt={pieceName} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[#C4A882] text-lg font-display">LS</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug truncate">{pieceName}</p>
          {piece.sku && <p className="text-[11px] font-mono text-[#6B6B6B] mt-0.5">{piece.sku}</p>}
          <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{piecePrice}</p>
        </div>
        <HiChevronRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#C4A882] flex-shrink-0 transition-colors" />
      </Link>
    );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#C4A882] mb-6 transition-colors">
          <HiArrowLeft className="w-4 h-4" /> {t('product.back')}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <GalleryBlock images={galleryImages} />

          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                {product.category && (
                  <Link to={`/catalog/${product.category.slug}`} className="text-sm text-[#C4A882] hover:underline">
                    {isRu ? product.category.nameRu : product.category.nameEn}
                  </Link>
                )}
                <h1 className="font-display text-2xl md:text-3xl font-semibold mt-1">{name}</h1>
                <div className="flex gap-1.5 mt-2">
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider bg-[#7C5C9A] text-white">
                    {t('product.costume_label')}
                  </span>
                  {product.labels?.filter((l: string) => l !== 'КОСТЮМ' && l !== 'SET').map((label: string) => {
                    const st = label === 'SALE' ? 'bg-red-500 text-white'
                      : label === 'HIT' ? 'bg-[#C4A882] text-white'
                      : label.startsWith('-') ? 'bg-red-500 text-white'
                      : 'bg-[#1A1A1A] text-white';
                    return <span key={label} className={`text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${st}`}>{label}</span>;
                  })}
                </div>
              </div>
              <button
                onClick={() => toggleItem({ productId: product.id, slug: product.slug, nameRu: product.nameRu, nameEn: product.nameEn, priceByn: Number(product.priceByn), priceUsd: Number(product.priceUsd), image: galleryImages[0] })}
                className="p-2 hover:text-[#C4A882] transition-colors"
              >
                {fav ? <HiHeart className="w-6 h-6 text-[#C4A882]" /> : <HiOutlineHeart className="w-6 h-6" />}
              </button>
            </div>

            {/* Set price */}
            <div className="mb-5">
              <p className="text-2xl font-semibold">{price}</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">{t('product.set_price')}</p>
              {savings > 0 && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Выгода {savingsPrice} при покупке комплектом
                </p>
              )}
            </div>

            {/* Costume own colors */}
            {product.colors?.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium mb-2">{t('product.color')}</p>
                <ColorSelector colors={product.colors} selected={selectedColor} onSelect={setSelectedColor} />
              </div>
            )}

            {/* Sizes for top and bottom */}
            <div className="space-y-3 mb-5">
              {top.sizes?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1.5">
                    {t('product.size')} <span className="text-[#7C5C9A] text-xs font-normal ml-1">{slotLabel(1)}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {top.sizes.map((sz: string) => (
                      <button key={sz} onClick={() => setSelectedTopSize(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${selectedTopSize === sz ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E5E5E3] hover:border-[#C4A882]'}`}>
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {bottom.sizes?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1.5">
                    {t('product.size')} <span className="text-[#7C5C9A] text-xs font-normal ml-1">{slotLabel(2)}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {bottom.sizes.map((sz: string) => (
                      <button key={sz} onClick={() => setSelectedBottomSize(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${selectedBottomSize === sz ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E5E5E3] hover:border-[#C4A882]'}`}>
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {extraItems.map((item: any, idx: number) => (
                item.sizes?.length > 0 && (
                  <div key={item.id}>
                    <p className="text-sm font-medium mb-1.5">
                      {t('product.size')} <span className="text-[#7C5C9A] text-xs font-normal ml-1">{slotLabel(idx + 3)}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.sizes.map((sz: string) => (
                        <button key={sz} onClick={() => setExtraSizes((prev) => { const next = [...prev]; next[idx] = sz; return next; })}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${extraSizes[idx] === sz ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'border-[#E5E5E3] hover:border-[#C4A882]'}`}>
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Buy set */}
            <button
              onClick={handleAddSetToCart}
              disabled={!top.inStock || !bottom.inStock}
              className={`w-full py-3.5 rounded-xl text-sm font-medium transition-colors mb-6 ${
                addedSet ? 'bg-green-600 text-white'
                : top.inStock && bottom.inStock ? 'bg-[#7C5C9A] text-white hover:bg-[#6A4E85]'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {addedSet ? t('product.added') + ' ✓'
                : top.inStock && bottom.inStock ? `${t('product.buy_set')} — ${price}`
                : t('catalog.out_of_stock')}
            </button>

            {/* Pieces preview */}
            <div className="border-t border-[#E5E5E3] pt-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#6B6B6B] mb-3">В составе комплекта</p>
              <div className="space-y-2.5">
                <PieceCard piece={top} pieceName={topName} piecePrice={topPriceFmt} label={slotLabel(1)} />
                <PieceCard piece={bottom} pieceName={bottomName} piecePrice={bottomPriceFmt} label={slotLabel(2)} />
                {extraItems.map((item: any, idx: number) => (
                  <PieceCard
                    key={item.id}
                    piece={item}
                    pieceName={isRu ? item.nameRu : item.nameEn}
                    piecePrice={formatPrice(item.priceByn, item.priceUsd, item.priceRub || 0, currency)}
                    label={slotLabel(idx + 3)}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            {desc && (
              <div className="mt-6 pt-6 border-t border-[#E5E5E3]">
                <h3 className="font-medium mb-3">{t('product.description')}</h3>
                <p className="text-[#6B6B6B] leading-relaxed">{desc}</p>
              </div>
            )}
          </div>
        </div>

        <ImageLightbox open={lightboxOpen} images={galleryImages} index={selectedImage} onChange={setSelectedImage} onClose={() => setLightboxOpen(false)} />
      </div>
    );
  }

  // Regular product layout
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#C4A882] mb-6 transition-colors">
        <HiArrowLeft className="w-4 h-4" /> {t('product.back')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        <GalleryBlock images={product.images} />

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
                  let hex = raw, cname = '';
                  try { const p = JSON.parse(raw); hex = p.hex; cname = p.name; } catch {}
                  return (
                    <button
                      key={raw}
                      onClick={() => setSelectedColor(raw)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                        selectedColor === raw ? 'border-[#C4A882] bg-[#F5F0EB]' : 'border-[#E5E5E3] hover:border-[#C4A882]'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full border border-[#E5E5E3] flex-shrink-0" style={{ backgroundColor: hex }} />
                      {cname && <span className="text-xs">{cname}</span>}
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
