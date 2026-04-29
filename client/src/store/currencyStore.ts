import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'BYN' | 'USD' | 'RUB';

interface CurrencyStore {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: (localStorage.getItem('currency') as Currency) || 'BYN',
      setCurrency: (currency) => {
        localStorage.setItem('currency', currency);
        set({ currency });
      },
    }),
    { name: 'lans-currency' }
  )
);

export function formatPrice(
  priceByn: number | string,
  priceUsd: number | string,
  priceRub: number | string,
  currency: Currency
): string {
  switch (currency) {
    case 'BYN': return `${Number(priceByn).toFixed(2)} BYN`;
    case 'USD': return `$${Number(priceUsd).toFixed(2)}`;
    case 'RUB': return `${Number(priceRub).toFixed(0)} ₽`;
  }
}
