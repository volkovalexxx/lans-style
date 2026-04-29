import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
              <p>г. Гродно, ул. Горького 91</p>
              <a href="tel:+375445218619" className="block hover:text-[#C4A882] transition-colors">+375 44 521-86-19</a>
              <a href="tel:+375336576247" className="block hover:text-[#C4A882] transition-colors">+375 33 657-62-47</a>
              <a href="mailto:Lansstil2007@gmail.com" className="block hover:text-[#C4A882] transition-colors break-all">
                Lansstil2007@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Legal info */}
        <div className="border-t border-white/10 mt-8 pt-6 text-xs leading-relaxed space-y-1">
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
