import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFavStore } from '../store/favStore';
import ProductCard from '../components/ProductCard';

export default function Favorites() {
  const { t } = useTranslation();
  const { items } = useFavStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-semibold mb-8">{t('favorites.title')}</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#6B6B6B] mb-8">{t('favorites.empty')}</p>
          <Link
            to="/catalog"
            className="inline-block bg-[#1A1A1A] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#333] transition-colors"
          >
            {t('cart.continue')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => (
            <ProductCard
              key={item.productId}
              product={{
                id: item.productId,
                slug: item.slug,
                nameRu: item.nameRu,
                nameEn: item.nameEn,
                priceByn: item.priceByn,
                priceUsd: item.priceUsd,
                images: item.image ? [item.image] : [],
                isNew: false,
                inStock: true,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
