import { motion } from 'framer-motion';
import {
  HiOutlineSparkles,
  HiOutlineGlobeAlt,
  HiOutlineScissors,
  HiOutlineCheckBadge,
  HiOutlineTruck,
  HiOutlineMapPin,
  HiOutlineHeart,
} from 'react-icons/hi2';

const stats = [
  { icon: HiOutlineCheckBadge, value: 'с 2007', label: 'Работаем на рынке' },
  { icon: HiOutlineScissors, value: '20+', label: 'Моделей каждый месяц' },
  { icon: HiOutlineSparkles, value: '5000+', label: 'Единиц в месяц' },
  { icon: HiOutlineTruck, value: 'По миру', label: 'Доставляем заказы' },
];

const features = [
  {
    icon: HiOutlineCheckBadge,
    title: 'Сертификаты качества',
    desc: 'Все изделия проходят контроль и имеют необходимые сертификаты соответствия.',
  },
  {
    icon: HiOutlineScissors,
    title: 'Размерный ряд 40–56',
    desc: 'Модели разрабатываются с учётом разных типов фигур, чтобы каждая женщина нашла свой размер.',
  },
  {
    icon: HiOutlineSparkles,
    title: 'Собственное производство',
    desc: 'Лекала создаются в немецкой программе GRAFIS — точный крой и безупречная посадка.',
  },
  {
    icon: HiOutlineGlobeAlt,
    title: 'Обширная география',
    desc: 'Магазины и торговые центры в Беларуси, России и странах СНГ.',
  },
];

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#FAFAF8] via-[#F5F0EB] to-[#FAFAF8] py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm uppercase tracking-[0.25em] text-[#C4A882] mb-4"
          >
            О компании
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1]"
          >
            Элегантность.<br />
            <span className="text-[#C4A882]">Комфорт.</span> Индивидуальность.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#6B6B6B] text-lg mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Lans Style — современное предприятие по производству женской одежды с 2007 года.
            Мы создаём вещи, которые подчёркивают вашу неповторимую индивидуальность.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white border border-[#E5E5E3] rounded-2xl p-6 text-center hover:border-[#C4A882] transition-colors"
            >
              <s.icon className="w-7 h-7 text-[#C4A882] mx-auto mb-3" />
              <p className="font-display text-2xl md:text-3xl font-semibold text-[#1A1A1A]">{s.value}</p>
              <p className="text-xs md:text-sm text-[#6B6B6B] mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="bg-[#F5F0EB] py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
            <div className="w-14 h-14 rounded-full bg-[#C4A882] flex items-center justify-center flex-shrink-0">
              <HiOutlineSparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
                Наша философия
              </h2>
              <p className="text-[#1A1A1A] text-lg leading-relaxed mb-4">
                Мы ценим эксклюзивность, которая помогает нам подчёркивать вашу неповторимую
                индивидуальность, не забывая о вашем комфорте.
              </p>
              <p className="text-[#6B6B6B] leading-relaxed">
                Работа высококвалифицированных специалистов на современном оборудовании позволяет
                нам ежемесячно выпускать около 20 новых моделей.
                Модели разрабатываются в собственной лаборатории компании — конструкторы прошли
                обучение по международной программе и применяют немецкую программу GRAFIS для
                безупречного кроя.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">Что нас отличает</h2>
          <p className="text-[#6B6B6B]">Четыре причины, почему нам доверяют</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white border border-[#E5E5E3] rounded-2xl p-6 md:p-8 flex gap-4 hover:border-[#C4A882] hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F5F0EB] flex items-center justify-center flex-shrink-0">
                <f.icon className="w-6 h-6 text-[#C4A882]" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1.5">{f.title}</h3>
                <p className="text-[#6B6B6B] text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Geography */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 md:pb-20">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white rounded-3xl p-8 md:p-12">
          <HiOutlineMapPin className="w-8 h-8 text-[#C4A882] mb-4" />
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">
            География продаж
          </h2>
          <p className="text-white/70 leading-relaxed">
            Ассортимент бренда Lans Style представлен в магазинах и крупных торговых центрах
            Республики Беларусь, а также в городах Российской Федерации и странах СНГ.
          </p>
        </div>
      </section>

      {/* Charity */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 md:pb-28">
        <div className="flex gap-5 items-start p-6 md:p-8 rounded-3xl border border-[#E5E5E3] bg-white">
          <div className="w-12 h-12 rounded-full bg-[#F5F0EB] flex items-center justify-center flex-shrink-0">
            <HiOutlineHeart className="w-6 h-6 text-[#C4A882]" />
          </div>
          <div>
            <h3 className="font-medium text-lg mb-2">Благотворительность</h3>
            <p className="text-[#6B6B6B] leading-relaxed">
              Компания активно участвует в благотворительных проектах. Мы оказываем помощь
              Щукинскому дому-интернату и Международному благотворительному фонду Юрия Розума.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
