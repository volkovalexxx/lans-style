import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineTrash, HiMinus, HiPlus } from 'react-icons/hi2';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore, formatPrice } from '../store/currencyStore';
import OrderForm from '../components/OrderForm';

export default function Cart() {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const { items, removeItem, updateQuantity, totalByn, totalUsd, totalRub } = useCartStore();
  const { currency } = useCurrencyStore();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold mb-4">{t('cart.title')}</h1>
        <p className="text-[#6B6B6B] mb-8">{t('cart.empty')}</p>
        <Link
          to="/catalog"
          className="inline-block bg-[#1A1A1A] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#333] transition-colors"
        >
          {t('cart.continue')}
        </Link>
      </div>
    );
  }

  const total = formatPrice(totalByn(), totalUsd(), totalRub(), currency);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-semibold mb-8">{t('cart.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const name = isRu ? item.nameRu : item.nameEn;
            const price = formatPrice(item.priceByn, item.priceUsd, item.priceRub || 0, currency);
            const key = `${item.productId}-${item.size}-${item.color}`;

            return (
              <div key={key} className="flex gap-4 bg-white p-4 rounded-xl">
                <Link to={`/product/${item.slug}`} className="w-20 h-24 rounded-lg overflow-hidden bg-[#F5F0EB] flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#C4A882] text-lg font-display">LS</div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.slug}`} className="text-sm font-medium hover:text-[#C4A882] transition-colors">
                    {name}
                  </Link>
                  <div className="text-xs text-[#6B6B6B] mt-1">
                    {item.size && <span>{t('product.size')}: {item.size}</span>}
                    {item.size && item.color && <span> / </span>}
                    {item.color && (() => {
                      let hex = item.color, name = item.color;
                      try {
                        const p = JSON.parse(item.color);
                        if (p.hex) { hex = p.hex; name = p.name || p.hex; }
                      } catch {}
                      return (
                        <span className="inline-flex items-center gap-1 align-middle">
                          {t('product.color')}:
                          <span className="w-3.5 h-3.5 rounded-full inline-block border border-[#E5E5E3]" style={{ backgroundColor: hex }} />
                          <span>{name}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-sm font-semibold mt-2">{price}</p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.productId, item.size, item.color)}
                    className="text-[#6B6B6B] hover:text-red-500 transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1, item.size, item.color)}
                      className="w-7 h-7 rounded-full border border-[#E5E5E3] flex items-center justify-center hover:border-[#C4A882] transition-colors"
                    >
                      <HiMinus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size, item.color)}
                      className="w-7 h-7 rounded-full border border-[#E5E5E3] flex items-center justify-center hover:border-[#C4A882] transition-colors"
                    >
                      <HiPlus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order form + total */}
        <div>
          <div className="bg-white p-6 rounded-xl mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[#6B6B6B]">{t('cart.total')}</span>
              <span className="text-xl font-semibold">{total}</span>
            </div>
          </div>
          <OrderForm />
        </div>
      </div>
    </div>
  );
}
