import { useTranslation } from 'react-i18next';
import { useCurrencyStore, type Currency } from '../store/currencyStore';

const currencies: Currency[] = ['BYN', 'USD', 'RUB'];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { currency, setCurrency } = useCurrencyStore();

  const toggleLang = () => {
    const next = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  const cycleCurrency = () => {
    const idx = currencies.indexOf(currency);
    setCurrency(currencies[(idx + 1) % currencies.length]);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={toggleLang}
        className="text-xs font-medium border border-[#E5E5E3] rounded-full px-3 py-1.5 hover:border-[#C4A882] hover:text-[#C4A882] transition-colors"
      >
        {i18n.language === 'ru' ? 'RU' : 'EN'}
      </button>
      <button
        onClick={cycleCurrency}
        className="text-xs font-medium border border-[#E5E5E3] rounded-full px-3 py-1.5 hover:border-[#C4A882] hover:text-[#C4A882] transition-colors"
      >
        {currency === 'RUB' ? '₽' : currency}
      </button>
    </div>
  );
}
