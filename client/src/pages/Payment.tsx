import { motion } from 'framer-motion';
import {
  HiOutlineCreditCard,
  HiOutlineTruck,
  HiOutlineArrowPath,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineBanknotes,
} from 'react-icons/hi2';
import Flag from '../components/Flag';

const eripSteps = [
  'Войдите в интернет-банкинг, инфокиоск или банкомат',
  'Выберите пункт «Система «Расчёт» (ЕРИП)»',
  'Перейдите в раздел «Интернет-магазины / услуги»',
  'Найдите букву «L» → «Lans-style.by»',
  'Введите номер вашего заказа',
  'Проверьте данные и подтвердите оплату',
];

const returnConditions = [
  'Сохранён товарный вид и потребительские свойства',
  'Сохранены ярлыки и упаковка',
  'Прилагается заявление на возврат',
  'Указаны реквизиты для возврата денежных средств',
];

export default function Payment() {
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
            Покупателям
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1]"
          >
            Оплата и доставка
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#6B6B6B] text-lg mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Удобные способы оплаты и быстрая доставка по Беларуси, России и дальше.
          </motion.p>
        </div>
      </section>

      {/* Purchase conditions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="flex gap-4 items-start p-6 md:p-7 bg-white border border-[#E5E5E3] rounded-3xl">
          <div className="w-11 h-11 rounded-full bg-[#F5F0EB] flex items-center justify-center flex-shrink-0">
            <HiOutlineInformationCircle className="w-6 h-6 text-[#C4A882]" />
          </div>
          <div>
            <h3 className="font-medium text-lg mb-2">Условия продажи</h3>
            <p className="text-[#6B6B6B] leading-relaxed">
              Реализация моделей осуществляется размерными рядами. Единичные изделия можно приобрести
              при условии, что есть разбитые ряды. Для уточнения возможности покупки отдельного товара
              оформите заказ на сайте и дождитесь обратной связи от менеджера.
            </p>
          </div>
        </div>
      </section>

      {/* Payment + Delivery cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 md:pb-12">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Payment */}
          <div className="bg-white border border-[#E5E5E3] rounded-3xl p-6 md:p-8">
            <div className="w-12 h-12 rounded-xl bg-[#F5F0EB] flex items-center justify-center mb-5">
              <HiOutlineCreditCard className="w-6 h-6 text-[#C4A882]" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">Оплата</h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              Оплата производится через систему <strong className="text-[#1A1A1A]">«Расчёт» (ЕРИП)</strong> после
              подтверждения заказа менеджером.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F5F0EB] text-[#1A1A1A]">
                <HiOutlineBanknotes className="w-3.5 h-3.5" /> ЕРИП
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F5F0EB] text-[#1A1A1A]">
                Картой
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F5F0EB] text-[#1A1A1A]">
                Банковский перевод
              </span>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white border border-[#E5E5E3] rounded-3xl p-6 md:p-8">
            <div className="w-12 h-12 rounded-xl bg-[#F5F0EB] flex items-center justify-center mb-5">
              <HiOutlineTruck className="w-6 h-6 text-[#C4A882]" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">Доставка</h2>
            <ul className="space-y-3">
              <li className="flex gap-3 items-center">
                <Flag code="by" className="w-7 h-7" />
                <div>
                  <p className="font-medium text-[#1A1A1A]">Беларусь</p>
                  <p className="text-sm text-[#6B6B6B]">Бесплатно — Автолайтэкспресс</p>
                </div>
              </li>
              <li className="flex gap-3 items-center">
                <Flag code="ru" className="w-7 h-7" />
                <div>
                  <p className="font-medium text-[#1A1A1A]">Россия</p>
                  <p className="text-sm text-[#6B6B6B]">СДЕК</p>
                </div>
              </li>
              <li className="flex gap-3 items-center">
                <Flag code="world" className="w-7 h-7" />
                <div>
                  <p className="font-medium text-[#1A1A1A]">Другие страны</p>
                  <p className="text-sm text-[#6B6B6B]">По запросу — уточняйте у менеджера</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ERIP instruction */}
      <section className="bg-[#F5F0EB] py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">
              Как оплатить через ЕРИП
            </h2>
            <p className="text-[#6B6B6B]">Пошаговая инструкция оплаты в банке, интернет-банкинге, инфокиоске или банкомате</p>
          </div>

          <ol className="grid sm:grid-cols-2 gap-3">
            {eripSteps.map((step, i) => (
              <motion.li
                key={step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex gap-4 items-start bg-white rounded-2xl p-5 border border-[#E5E5E3]"
              >
                <span className="w-8 h-8 rounded-full bg-[#C4A882]/15 text-[#C4A882] font-display text-base font-semibold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm md:text-base text-[#1A1A1A] leading-relaxed pt-0.5">{step}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Returns */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="bg-white border border-[#E5E5E3] rounded-3xl p-6 md:p-10">
          <div className="w-12 h-12 rounded-xl bg-[#F5F0EB] flex items-center justify-center mb-5">
            <HiOutlineArrowPath className="w-6 h-6 text-[#C4A882]" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">Возврат товара</h2>
          <p className="text-[#6B6B6B] leading-relaxed mb-5">
            Возврат осуществляется <strong className="text-[#1A1A1A]">в течение 14 дней</strong> после
            получения товара при соблюдении условий ниже. Товар, бывший в употреблении, к возврату не принимается.
          </p>

          <div className="grid sm:grid-cols-2 gap-2.5">
            {returnConditions.map((c) => (
              <div key={c} className="flex gap-2.5 items-start p-3.5 rounded-xl bg-[#FAFAF8]">
                <HiOutlineCheckCircle className="w-5 h-5 text-[#C4A882] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#1A1A1A] leading-relaxed">{c}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-[#F5F0EB] text-sm text-[#6B6B6B] leading-relaxed">
            <strong className="text-[#1A1A1A]">Важно:</strong> для возврата необходимо приложить
            заявление с личными данными и реквизитами для возврата денежных средств. Перед отправкой
            свяжитесь с менеджером для согласования деталей.
          </div>
        </div>
      </section>
    </div>
  );
}
