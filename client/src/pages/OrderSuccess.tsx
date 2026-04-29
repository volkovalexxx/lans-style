import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function OrderSuccess() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
      >
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="font-display text-3xl font-semibold mb-4">
          {t('order_success.title')}
        </h1>
        <p className="text-[#6B6B6B] text-lg leading-relaxed mb-3">
          {t('order_success.message')}
        </p>
        <p className="text-[#6B6B6B] mb-10">
          {t('order_success.contact')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/catalog"
            className="inline-block bg-[#1A1A1A] text-white px-8 py-3.5 rounded-full text-sm font-medium hover:bg-[#333] transition-colors"
          >
            {t('order_success.to_catalog')}
          </Link>
          <Link
            to="/"
            className="inline-block border border-[#E5E5E3] text-[#1A1A1A] px-8 py-3.5 rounded-full text-sm font-medium hover:border-[#C4A882] transition-colors"
          >
            {t('order_success.to_home')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
