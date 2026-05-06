import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-[7rem] font-light text-[#E5E5E3] leading-none select-none">404</p>
      <h1 className="mt-4 text-2xl font-medium text-[#1A1A1A]">Страница не найдена</h1>
      <p className="mt-2 text-[#6B6B6B] text-sm">Возможно, она была удалена или адрес указан неверно.</p>
      <Link
        to="/"
        className="mt-8 inline-block bg-[#1A1A1A] text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-[#333] transition-colors"
      >
        На главную
      </Link>
    </div>
  );
}
