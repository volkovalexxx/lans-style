import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  HiOutlineSparkles,
  HiOutlineScissors,
  HiOutlineTruck,
  HiOutlineCheckBadge,
  HiArrowRight,
} from 'react-icons/hi2';
import ProductCarousel from '../components/ProductCarousel';
import { useApi } from '../hooks/useApi';

export default function Home() {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const { data: homeCards, loading: catsLoading } = useApi<any[]>('/home-cards');
  const { data: newProductsData } = useApi<{ products: any[] }>('/products', { isNew: 'true', limit: '8' });
  const { data: latestProductsData, loading: latestLoading } = useApi<{ products: any[] }>('/products', { limit: '8', sort: 'new' });

  // Show whichever arrives first; prefer isNew if non-empty
  const productsData = (newProductsData?.products?.length ?? 0) > 0
    ? newProductsData
    : latestProductsData;
  const productsLoading = !productsData && latestLoading;

  const featured = homeCards?.[0];
  const rest = homeCards?.slice(1, 5) || [];

  const usps = [
    { icon: HiOutlineSparkles, title: t('home.usp_quality_title'), desc: t('home.usp_quality_desc') },
    { icon: HiOutlineScissors, title: t('home.usp_sizes_title'), desc: t('home.usp_sizes_desc') },
    { icon: HiOutlineTruck, title: t('home.usp_delivery_title'), desc: t('home.usp_delivery_desc') },
    { icon: HiOutlineCheckBadge, title: t('home.usp_since_title'), desc: t('home.usp_since_desc') },
  ];

  // Try to pick a nice image from first product for editorial block
  const editorialImage = productsData?.products?.[0]?.images?.[0];

  return (
    <div>
      {/* Banner */}
      <section className="relative h-[75vh] min-h-[540px] bg-[#1A1A1A] flex items-center overflow-hidden">
        <video src="/hero.mov" autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover object-center md:hidden" />
        <img src="/hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover hidden md:block" style={{ objectPosition: '50% 35%' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/70 via-[#1A1A1A]/30 to-transparent z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-white/80 text-xs uppercase tracking-[0.3em] mb-5"
          >
            Lans Style · Belarus · Since 2007
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.05] max-w-xl"
          >
            {t('home.banner_title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-white/90 text-lg mt-6 mb-10 max-w-md"
          >
            {t('home.banner_subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-white text-[#1A1A1A] px-8 py-4 rounded-full text-sm font-medium hover:bg-[#C4A882] hover:text-white transition-colors"
            >
              {t('home.banner_cta')} <HiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* USPs */}
      <section className="border-b border-[#E5E5E3] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
            {usps.map((u, i) => (
              <motion.div
                key={u.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center gap-3 md:gap-4"
              >
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#F5F0EB] flex items-center justify-center flex-shrink-0">
                  <u.icon className="w-5 h-5 md:w-6 md:h-6 text-[#C4A882]" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm md:text-base text-[#1A1A1A] leading-snug">{u.title}</p>
                  <p className="text-xs md:text-sm text-[#6B6B6B] truncate">{u.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals carousel */}
      <section className="max-w-7xl mx-auto px-0 sm:px-6 py-16 md:py-24">
        <div className="flex items-end justify-between mb-8 md:mb-12 px-4 sm:px-0">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#C4A882] mb-2">Collection</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
              {t('home.new_arrivals')}
            </h2>
          </div>
          <Link
            to="/catalog?isNew=true"
            className="text-sm text-[#C4A882] hover:underline font-medium whitespace-nowrap"
          >
            {t('home.see_all')} →
          </Link>
        </div>
        {productsLoading ? (
          <div className="flex gap-4 overflow-hidden px-4 sm:px-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-56 md:w-64 animate-pulse">
                <div className="aspect-[3/4] rounded-2xl bg-[#E8DDD0] mb-3" />
                <div className="h-3 bg-[#E8DDD0] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#E8DDD0] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : productsData?.products && productsData.products.length > 0 ? (
          <ProductCarousel products={productsData.products} />
        ) : null}
      </section>

      {/* Editorial banner */}
      <section className="relative bg-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-0">
          {editorialImage ? (
            <img src={editorialImage} alt="" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#2A2A2A] via-[#1A1A1A] to-[#C4A882]/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-[#1A1A1A]/80 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32 lg:py-40">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-4"
          >
            {t('home.editorial_caption')}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] max-w-xl"
          >
            {t('home.editorial_title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/70 text-base md:text-lg mt-6 max-w-md leading-relaxed"
          >
            {t('home.editorial_desc')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 md:mt-10"
          >
            <Link
              to="/about"
              className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-3.5 rounded-full text-sm font-medium hover:bg-white hover:text-[#1A1A1A] transition-colors"
            >
              {t('home.editorial_cta')} <HiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories — bento grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#C4A882] mb-2">
              {t('home.categories_caption')}
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold">
              {t('home.categories_title')}
            </h2>
          </div>
          <Link
            to="/catalog"
            className="text-sm text-[#C4A882] hover:underline font-medium whitespace-nowrap"
          >
            {t('home.see_all')} →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-3 md:gap-4">
          {catsLoading ? (
            <>
              <div className="col-span-2 row-span-2 rounded-2xl md:rounded-3xl bg-[#E8DDD0] animate-pulse" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="col-span-1 row-span-1 rounded-2xl bg-[#E8DDD0] animate-pulse" />
              ))}
            </>
          ) : (
            <>
              {featured && featured.category && (
                <BentoCategoryCard
                  category={featured.category}
                  overrideImage={featured.resolvedImage}
                  name={isRu ? featured.category.nameRu : featured.category.nameEn}
                  featured
                  className="col-span-2 row-span-2"
                />
              )}
              {rest.map((card) => card.category && (
                <BentoCategoryCard
                  key={card.id}
                  category={card.category}
                  overrideImage={card.resolvedImage}
                  name={isRu ? card.category.nameRu : card.category.nameEn}
                  className="col-span-1 row-span-1"
                />
              ))}
            </>
          )}
        </div>
      </section>

      {/* About short */}
      <section className="bg-[#F5F0EB] py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#C4A882] mb-4">Lans Style</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
            {t('home.about_short')}
          </h2>
          <p className="text-[#6B6B6B] leading-relaxed text-lg">
            {t('home.about_text')}
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 mt-8 border border-[#1A1A1A] text-[#1A1A1A] px-8 py-3 rounded-full text-sm font-medium hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            {t('nav.about')} <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

interface BentoProps {
  category: {
    id: number;
    slug: string;
    image?: string | null;
    previewImage?: string | null;
    _count?: { products: number };
  };
  overrideImage?: string | null;
  name: string;
  featured?: boolean;
  className?: string;
}

function BentoCategoryCard({ category, overrideImage, name, featured, className = '' }: BentoProps) {
  const backgroundImage = overrideImage || category.image || category.previewImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Link
        to={`/catalog/${category.slug}`}
        className="group relative block w-full h-full overflow-hidden rounded-2xl md:rounded-3xl bg-[#F5F0EB]"
      >
        {backgroundImage ? (
          <img
            src={backgroundImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F5F0EB] via-[#E8DDD0] to-[#D4BC9A]/50 group-hover:from-[#EDE5D8] group-hover:to-[#C4A882]/40 transition-colors duration-500">
            <span className="font-display text-[#C4A882] text-7xl md:text-9xl opacity-60 group-hover:scale-110 transition-transform duration-500">
              {name[0]}
            </span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content */}
        <div className={`absolute inset-0 flex flex-col justify-end ${featured ? 'p-6 md:p-8' : 'p-4 md:p-5'}`}>
          <h3 className={`font-display text-white font-semibold leading-tight ${
            featured ? 'text-2xl md:text-4xl lg:text-5xl' : 'text-lg md:text-xl'
          }`}>
            {name}
          </h3>
          {category._count && (
            <p className={`text-white/70 mt-1 ${featured ? 'text-sm md:text-base' : 'text-xs'}`}>
              {category._count.products} товаров
            </p>
          )}

          {/* Arrow indicator */}
          <div className="absolute top-4 right-4 md:top-5 md:right-5 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <HiArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
