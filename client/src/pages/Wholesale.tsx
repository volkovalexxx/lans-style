import { motion } from 'framer-motion';
import {
  HiOutlineUserPlus,
  HiOutlinePhone,
  HiOutlineDocumentText,
  HiOutlineBanknotes,
  HiOutlineCube,
  HiOutlineCheckBadge,
  HiOutlineTruck,
  HiOutlineCreditCard,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2';
import WholesaleForm from '../components/WholesaleForm';
import Flag from '../components/Flag';

const steps = [
  { icon: HiOutlineUserPlus, title: 'Заявка', desc: 'Оставьте заявку в форме ниже — укажите название компании и контактные данные' },
  { icon: HiOutlinePhone, title: 'Связь с менеджером', desc: 'Персональный менеджер свяжется с вами, обсудит условия и ответит на вопросы' },
  { icon: HiOutlineCube, title: 'Формирование заказа', desc: 'Вместе подберём ассортимент, размерные ряды и согласуем партию' },
  { icon: HiOutlineBanknotes, title: 'Оплата', desc: 'Получите счёт и переведёте средства на расчётный счёт компании' },
  { icon: HiOutlineTruck, title: 'Получение заказа', desc: 'Доставим вашу партию в удобное место или до двери' },
];

const provides = [
  'Договор о поставке продукции',
  'Сертификат соответствия на изделия',
  'Накладные ТТН',
  'Счёт-фактуру',
  'Рекламные материалы',
];

const terms: Array<{
  region: string;
  minOrder: string;
  payment: string[];
  delivery: string[];
  flag: 'by' | 'ru' | 'world';
}> = [
  {
    region: 'Республика Беларусь',
    minOrder: 'Один размерный ряд',
    payment: ['Перечисление на счёт', 'Система «Расчёт» (ЕРИП)'],
    delivery: ['Автолайтэкспресс до двери за 1–2 дня'],
    flag: 'by',
  },
  {
    region: 'Российская Федерация',
    minOrder: '25 единиц',
    payment: ['Перечисление на счёт', 'Карты VISA / Master Card'],
    delivery: ['СДЕК', 'DPD'],
    flag: 'ru',
  },
  {
    region: 'Любая точка мира',
    minOrder: 'По согласованию',
    payment: ['Карты VISA / Master Card'],
    delivery: ['РУП «Белпочта»'],
    flag: 'world',
  },
];

export default function Wholesale() {
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
            Партнёрам
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1]"
          >
            Выгодные условия для<br />
            <span className="text-[#C4A882]">оптовых покупателей</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#6B6B6B] text-lg mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Мы работаем с магазинами, торговыми центрами и частными предпринимателями
            в Беларуси, России и странах СНГ.
          </motion.p>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">
            Как стать партнёром
          </h2>
          <p className="text-[#6B6B6B]">Пять простых шагов до вашего первого заказа</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="relative bg-white border border-[#E5E5E3] rounded-2xl p-5 hover:border-[#C4A882] transition-colors"
            >
              <span className="absolute top-4 right-4 text-xs font-mono text-[#C4A882]">0{i + 1}</span>
              <div className="w-11 h-11 rounded-xl bg-[#F5F0EB] flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-[#C4A882]" />
              </div>
              <h3 className="font-medium mb-1.5">{s.title}</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Documents & provides */}
      <section className="bg-[#F5F0EB] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-6">
          {/* Documents required */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E5E3]">
            <HiOutlineDocumentText className="w-8 h-8 text-[#C4A882] mb-4" />
            <h3 className="font-display text-2xl font-semibold mb-4">Документы для договора</h3>
            <ul className="space-y-3 text-[#6B6B6B]">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4A882] mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-[#1A1A1A]">Юридические лица</strong> — реквизиты, ФИО
                  и должность лица, уполномоченного заключать договоры.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4A882] mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-[#1A1A1A]">ИП</strong> — копии свидетельства о
                  государственной регистрации, реквизиты и данные паспорта.
                </span>
              </li>
            </ul>
          </div>

          {/* What we provide */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E5E3]">
            <HiOutlineCheckBadge className="w-8 h-8 text-[#C4A882] mb-4" />
            <h3 className="font-display text-2xl font-semibold mb-4">Что мы предоставляем</h3>
            <ul className="space-y-2.5">
              {provides.map((item) => (
                <li key={item} className="flex gap-2.5 items-center text-[#1A1A1A]">
                  <HiOutlineCheckBadge className="w-4 h-4 text-[#C4A882] flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Terms info */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 md:p-8">
            <h3 className="font-display text-xl md:text-2xl font-semibold mb-4">
              Условия оптовых закупок
            </h3>
            <ul className="space-y-2.5 text-white/80 text-sm md:text-base leading-relaxed">
              <li>• Минимальный объём партии при заказе в Беларуси — <strong className="text-white">один размерный ряд</strong>.</li>
              <li>• Минимальная партия для клиентов из России — <strong className="text-white">25 единиц</strong>.</li>
              <li>• Реализация осуществляется размерными рядами; единичные изделия можно приобрести при условии разбитых рядов.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Payment & delivery by region */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">
            Оплата и доставка
          </h2>
          <p className="text-[#6B6B6B]">Работаем в трёх регионах с удобными способами оплаты</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {terms.map((t) => (
            <div
              key={t.region}
              className="bg-white border border-[#E5E5E3] rounded-2xl p-6 hover:border-[#C4A882] transition-colors"
            >
              <div className="flex items-center gap-3 mb-5">
                <Flag code={t.flag} className="w-9 h-9" />
                <h3 className="font-display text-xl font-semibold">{t.region}</h3>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-1">Мин. заказ</p>
                  <p className="text-[#1A1A1A] font-medium">{t.minOrder}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-1.5 flex items-center gap-1.5">
                    <HiOutlineCreditCard className="w-3.5 h-3.5" /> Оплата
                  </p>
                  <ul className="space-y-1">
                    {t.payment.map((p) => (
                      <li key={p} className="text-[#1A1A1A]">{p}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-1.5 flex items-center gap-1.5">
                    <HiOutlineTruck className="w-3.5 h-3.5" /> Доставка
                  </p>
                  <ul className="space-y-1">
                    {t.delivery.map((d) => (
                      <li key={d} className="text-[#1A1A1A]">{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section id="request" className="bg-[#F5F0EB] py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <HiOutlineGlobeAlt className="w-10 h-10 text-[#C4A882] mx-auto mb-3" />
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">
              Оставьте заявку
            </h2>
            <p className="text-[#6B6B6B]">
              Заполните форму — и мы свяжемся с вами для обсуждения условий сотрудничества.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E5E3]">
            <WholesaleForm />
          </div>
        </div>
      </section>
    </div>
  );
}
