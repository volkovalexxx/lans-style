import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface Props {
  category: {
    id: number;
    slug: string;
    nameRu: string;
    nameEn: string;
    image?: string | null;
    _count?: { products: number };
  };
}

export default function CategoryCard({ category }: Props) {
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const name = isRu ? category.nameRu : category.nameEn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        to={`/catalog/${category.slug}`}
        className="block group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#F5F0EB]"
      >
        {category.image ? (
          <img
            src={category.image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#C4A882] text-5xl font-display">
            {name[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-medium text-lg">{name}</h3>
          {category._count && (
            <p className="text-white/70 text-sm">{category._count.products} items</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
