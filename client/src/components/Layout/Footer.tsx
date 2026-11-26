import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaInstagram } from 'react-icons/fa6';
import { openCookieSettings } from '../../utils/cookieConsent';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#1A1A1A] text-white/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-display text-2xl text-white mb-3">Lans Style</h3>
            <p className="text-sm leading-relaxed mb-4">
              {t('home.about_text')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-medium mb-3">Компания</h4>
            <div className="space-y-2 text-sm">
              <Link to="/about" className="block hover:text-[#C4A882] transition-colors">
                {t('nav.about')}
              </Link>
              <Link to="/wholesale" className="block hover:text-[#C4A882] transition-colors">
                Партнёрам
              </Link>
              <Link to="/cooperation" className="block hover:text-[#C4A882] transition-colors">
                Сотрудничество
              </Link>
              <Link to="/payment" className="block hover:text-[#C4A882] transition-colors">
                Оплата и доставка
              </Link>
              <Link to="/contacts" className="block hover:text-[#C4A882] transition-colors">
                {t('nav.contacts')}
              </Link>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-white font-medium mb-3">{t('nav.contacts')}</h4>
            <div className="space-y-2 text-sm">
              <p>Шоурум: г. Гродно, ул. Советская 14</p>
              <p>Пн–Вс 10:00–20:00</p>
              <a href="tel:+375336576247" className="block hover:text-[#C4A882] transition-colors">+375 33 657-62-47 <span className="text-white/50">(общий)</span></a>
              <a href="tel:+375445218619" className="block hover:text-[#C4A882] transition-colors">+375 44 521-86-19 <span className="text-white/50">(Гродно, Советская 14)</span></a>
              <a href="mailto:Lansstil2007@gmail.com" className="block hover:text-[#C4A882] transition-colors break-all">
                Lansstil2007@gmail.com
              </a>
              <a href="https://www.instagram.com/lans_style" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-[#C4A882] transition-colors">
                <FaInstagram className="w-4 h-4" /> @lans_style
              </a>
            </div>
          </div>
        </div>

        {/* Consumer complaints */}
        <div className="border-t border-white/10 mt-8 pt-6 text-xs leading-relaxed space-y-2">
          <p>
            Лицо, уполномоченное ООО &laquo;Ланс-Стиль&raquo; рассматривать обращения покупателей о нарушении их
            прав, предусмотренных законодательством о защите прав потребителей:{' '}
            <a href="tel:+375336576247" className="hover:text-[#C4A882] transition-colors whitespace-nowrap">+375 (33) 657-62-47</a>,{' '}
            <a href="mailto:Lansstil2007@gmail.com" className="hover:text-[#C4A882] transition-colors">Lansstil2007@gmail.com</a>
          </p>
          <p>
            Управление торговли и услуг Гродненского горисполкома (для обращений покупателей): 8 (0152) 62-69-44,
            62-69-45, 62-69-67, 62-69-71, 62-69-47, 62-69-13
          </p>
        </div>

        {/* Legal links */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <Link to="/privacy" className="hover:text-[#C4A882] transition-colors underline underline-offset-2">
            Политика обработки персональных данных и cookie
          </Link>
          <Link to="/personal-data-consent" className="hover:text-[#C4A882] transition-colors underline underline-offset-2">
            Согласие на обработку персональных данных
          </Link>
          <button type="button" onClick={openCookieSettings} className="hover:text-[#C4A882] transition-colors underline underline-offset-2">
            Настройки cookie
          </button>
        </div>

        {/* Legal info */}
        <div className="border-t border-white/10 mt-6 pt-6 text-xs leading-relaxed space-y-1">
          <p>&copy; {new Date().getFullYear()} ООО &laquo;Ланс-Стиль&raquo;. {t('footer.rights')}.</p>
          <p>Республика Беларусь, г. Гродно, ул. Горького 91. УНП 590683474</p>
          <p>
            Свидетельство о государственной регистрации от 08.10.2007 года №57, выданное
            Администрацией свободной экономической зоны &laquo;Гродноинвест&raquo;
          </p>
          <p>
            Интернет-магазин lans-style.by добавлен в торговый реестр Республики Беларусь
            18.01.2022 №527067
          </p>
        </div>
      </div>
    </footer>
  );
}
