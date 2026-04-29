import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineCheckBadge,
  HiOutlineScissors,
  HiOutlineSparkles,
  HiOutlineGlobeAlt,
  HiArrowRight,
} from 'react-icons/hi2';

const advantages = [
  { icon: HiOutlineCheckBadge, label: 'Все изделия с сертификатами' },
  { icon: HiOutlineScissors, label: 'Размерный ряд 40–52' },
  { icon: HiOutlineSparkles, label: 'Более 10 000 единиц в месяц' },
  { icon: HiOutlineGlobeAlt, label: 'Доставка по всему миру' },
];

const steps = [
  {
    title: 'Оставьте заявку',
    desc: 'Заполните короткую форму — укажите компанию, контакты и формат сотрудничества, который вам интересен.',
  },
  {
    title: 'Знакомство и условия',
    desc: 'Персональный менеджер свяжется с вами, расскажет о линейке, ценах и специальных условиях для партнёров.',
  },
  {
    title: 'Договор и документы',
    desc: 'Подготовим договор о поставке, предоставим сертификаты соответствия и рекламные материалы для вашей точки.',
  },
  {
    title: 'Долгосрочное сотрудничество',
    desc: 'Регулярные поставки новых коллекций, индивидуальные условия и поддержка вашего бизнеса.',
  },
];

export default function Cooperation() {
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
            Сотрудничество
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1]"
          >
            Развивайте бизнес<br />
            <span className="text-[#C4A882]">вместе с Lans Style</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#6B6B6B] text-lg mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Мы открыты для сотрудничества с розничными и оптовыми магазинами,
            маркетплейсами и индивидуальными предпринимателями.
          </motion.p>
        </div>
      </section>

      {/* Advantages */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {advantages.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white border border-[#E5E5E3] rounded-2xl p-6 text-center hover:border-[#C4A882] transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-[#F5F0EB] flex items-center justify-center mx-auto mb-3">
                <a.icon className="w-6 h-6 text-[#C4A882]" />
              </div>
              <p className="text-sm text-[#1A1A1A] font-medium leading-snug">{a.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How to become partner */}
      <section className="bg-[#F5F0EB] py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">
              Как начать сотрудничество
            </h2>
            <p className="text-[#6B6B6B]">От первого контакта до долгосрочного партнёрства</p>
          </div>

          <ol className="space-y-4">
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex gap-5 items-start bg-white rounded-2xl p-5 md:p-6 border border-[#E5E5E3]"
              >
                <div className="w-10 h-10 rounded-full bg-[#C4A882] text-white font-display text-lg font-semibold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg mb-1">{step.title}</h3>
                  <p className="text-[#6B6B6B] leading-relaxed">{step.desc}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Documents */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="bg-white border border-[#E5E5E3] rounded-3xl p-6 md:p-10">
          <h3 className="font-display text-2xl md:text-3xl font-semibold mb-5">
            Документы для договора
          </h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-[#F5F0EB]">
              <p className="text-xs uppercase tracking-wider text-[#C4A882] font-medium mb-2">Юрлица</p>
              <p className="text-[#1A1A1A] leading-relaxed">
                Реквизиты, ФИО и должность лица, уполномоченного заключать договоры.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F5F0EB]">
              <p className="text-xs uppercase tracking-wider text-[#C4A882] font-medium mb-2">ИП</p>
              <p className="text-[#1A1A1A] leading-relaxed">
                Копии свидетельства о государственной регистрации, реквизиты и данные паспорта.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 md:pb-28">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white rounded-3xl p-8 md:p-12 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">
            Готовы начать сотрудничество?
          </h2>
          <p className="text-white/70 mb-6">
            Оставьте заявку на странице «Партнёрам» — менеджер свяжется с вами в ближайшее время.
          </p>
          <Link
            to="/wholesale#request"
            className="inline-flex items-center gap-2 bg-[#C4A882] hover:bg-[#A68E6A] text-white px-8 py-3.5 rounded-full text-sm font-medium transition-colors"
          >
            Оставить заявку
            <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
