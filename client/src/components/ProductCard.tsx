import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineHeart, HiHeart } from 'react-icons/hi2';
import { motion } from 'framer-motion';
import { useFavStore } from '../store/favStore';
import { useCurrencyStore, formatPrice } from '../store/currencyStore';

const labelStyles: Record<string, string> = {
  NEW: 'bg-[#1A1A1A] text-white',
  SALE: 'bg-red-500 text-white',
  HIT: 'bg-[#C4A882] text-white',
  КОСТЮМ: 'bg-[#7C5C9A] text-white',
  SET: 'bg-[#7C5C9A] text-white',
};

function getLabelStyle(label: string): string {
  return labelStyles[label.toUpperCase()] || 'bg-[#6B6B6B] text-white';
}

interface Props {
  product: {
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
    isCostume?: boolean;
  };
}

export default function ProductCard({ product }: Props) {
  const { i18n, t } = useTranslation();
  const isRu = i18n.language === 'ru';
  const { toggleItem, isFavorite } = useFavStore();
  const { currency } = useCurrencyStore();
  const fav = isFavorite(product.id);

  const name = isRu ? product.nameRu : product.nameEn;
  const price = formatPrice(product.priceByn, product.priceUsd, product.priceRub || 0, currency);
  const image = product.images[0];

  const costumeLabel = isRu ? 'КОСТЮМ' : 'SET';
  const baseLabels = product.labels?.filter(
    (l) => l !== 'КОСТЮМ' && l !== 'SET' && l !== 'COSTUME'
  ) ?? (product.isNew ? ['NEW'] : []);
  const labels = product.isCostume ? [costumeLabel, ...baseLabels] : baseLabels;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <Link to={`/product/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-[#F5F0EB]">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#C4A882] text-6xl font-display">
            LS
          </div>
        )}
        {labels.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {labels.map((label) => (
              <span
                key={label}
                className={`text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${getLabelStyle(label)}`}
              >
                {label}
              </span>
            ))}
          </div>
        )}
        {!product.inStock && (
          <span className="absolute top-3 right-3 bg-white/90 text-[#6B6B6B] text-[10px] font-medium px-2.5 py-1 rounded-full">
            {t('catalog.out_of_stock')}
          </span>
        )}
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/product/${product.slug}`} className="flex-1">
            <h3 className="text-sm font-medium text-[#1A1A1A] leading-tight mb-1 group-hover:text-[#C4A882] transition-colors">
              {name}
            </h3>
            <p className="text-sm font-semibold text-[#1A1A1A]">{price}</p>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
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
            className="p-1.5 hover:text-[#C4A882] transition-colors"
          >
            {fav ? (
              <HiHeart className="w-5 h-5 text-[#C4A882]" />
            ) : (
              <HiOutlineHeart className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
