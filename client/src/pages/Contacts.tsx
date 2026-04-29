import { motion } from 'framer-motion';
import {
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineClock,
  HiOutlineBuildingStorefront,
  HiOutlineShoppingBag,
  HiOutlineBriefcase,
} from 'react-icons/hi2';

const phones = [
  {
    icon: HiOutlineShoppingBag,
    label: 'Розничные продажи',
    number: '+375 44 521-86-19',
    tel: '+375445218619',
  },
  {
    icon: HiOutlineBuildingStorefront,
    label: 'Оптовые продажи',
    number: '+375 33 657-62-47',
    tel: '+375336576247',
  },
  {
    icon: HiOutlineBriefcase,
    label: 'Сотрудничество',
    number: '+375 33 657-62-47',
    tel: '+375336576247',
  },
];

const EMAIL = 'Lansstil2007@gmail.com';

export default function Contacts() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#FAFAF8] via-[#F5F0EB] to-[#FAFAF8] py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm uppercase tracking-[0.25em] text-[#C4A882] mb-4"
          >
            Контакты
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1]"
          >
            Свяжитесь с нами
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#6B6B6B] text-lg mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Ответим на все вопросы о заказах, сотрудничестве и нашей продукции.
          </motion.p>
        </div>
      </section>

      {/* Phones */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">Телефоны</h2>
          <p className="text-[#6B6B6B]">Каждое направление ведёт персональный менеджер</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {phones.map((p, i) => (
            <motion.a
              key={p.label}
              href={`tel:${p.tel}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group bg-white border border-[#E5E5E3] rounded-2xl p-6 hover:border-[#C4A882] hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F5F0EB] flex items-center justify-center mb-4 group-hover:bg-[#C4A882] transition-colors">
                <p.icon className="w-5 h-5 text-[#C4A882] group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-1">{p.label}</p>
              <p className="font-display text-xl md:text-2xl font-semibold text-[#1A1A1A] group-hover:text-[#C4A882] transition-colors">
                {p.number}
              </p>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Email + Schedule row */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <a
            href={`mailto:${EMAIL}`}
            className="group bg-white border border-[#E5E5E3] rounded-2xl p-6 md:p-7 hover:border-[#C4A882] hover:shadow-sm transition-all flex items-center gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F5F0EB] flex items-center justify-center flex-shrink-0 group-hover:bg-[#C4A882] transition-colors">
              <HiOutlineEnvelope className="w-6 h-6 text-[#C4A882] group-hover:text-white transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-1">Email</p>
              <p className="font-medium text-[#1A1A1A] group-hover:text-[#C4A882] transition-colors break-all">
                {EMAIL}
              </p>
            </div>
          </a>

          <div className="bg-white border border-[#E5E5E3] rounded-2xl p-6 md:p-7 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-[#F5F0EB] flex items-center justify-center flex-shrink-0">
              <HiOutlineClock className="w-6 h-6 text-[#C4A882]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-1">Режим работы</p>
              <p className="font-medium text-[#1A1A1A]">Пн–Пт: 10:00 — 20:00</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Для розничных покупателей</p>
            </div>
          </div>
        </div>
      </section>

      {/* Addresses */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">Наши адреса</h2>
          <p className="text-[#6B6B6B]">Офис и розничная точка в Гродно</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-[#E5E5E3] rounded-3xl p-6 md:p-8"
          >
            <HiOutlineMapPin className="w-7 h-7 text-[#C4A882] mb-3" />
            <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-1">Офис</p>
            <h3 className="font-display text-2xl font-semibold mb-2">ул. Горького, 91</h3>
            <p className="text-[#6B6B6B] text-sm">Республика Беларусь, г. Гродно</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-[#E5E5E3] rounded-3xl p-6 md:p-8"
          >
            <HiOutlineBuildingStorefront className="w-7 h-7 text-[#C4A882] mb-3" />
            <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-1">Рынок «Южный»</p>
            <h3 className="font-display text-2xl font-semibold mb-2">
              Индурское шоссе, 30/7
            </h3>
            <p className="text-[#6B6B6B] text-sm">Место 123 З</p>
          </motion.div>
        </div>
      </section>

      {/* Map */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 md:pb-20">
        <div className="rounded-3xl overflow-hidden border border-[#E5E5E3] aspect-[16/9] md:aspect-[21/9] bg-[#F5F0EB]">
          <iframe
            title="Lans Style — Гродно, Горького 91"
            src="https://yandex.com/map-widget/v1/?ll=23.829%2C53.668&z=14&text=%D0%93%D1%80%D0%BE%D0%B4%D0%BD%D0%BE%2C%20%D1%83%D0%BB.%20%D0%93%D0%BE%D1%80%D1%8C%D0%BA%D0%BE%D0%B3%D0%BE%2091"
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </section>

      {/* Legal */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 md:pb-28">
        <div className="bg-[#F5F0EB] rounded-3xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-wider text-[#C4A882] mb-3 font-medium">Реквизиты</p>
          <div className="space-y-2 text-sm md:text-base text-[#1A1A1A]">
            <p><strong>ООО «Ланс-Стиль»</strong></p>
            <p className="text-[#6B6B6B]">УНП 590683474</p>
            <p className="text-[#6B6B6B] text-sm">
              Свидетельство о государственной регистрации от 08.10.2007 №57, выданное
              Администрацией свободной экономической зоны «Гродноинвест».
            </p>
            <p className="text-[#6B6B6B] text-sm">
              Интернет-магазин lans-style.by добавлен в Торговый реестр Республики Беларусь
              18.01.2022 №527067.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
