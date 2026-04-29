import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2';
import api from '../../api/client';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  newOrders: number;
  totalWholesale: number;
  recentVisits: number;
  ordersByStatus: Array<{ status: string; count: number }>;
}

const navItems = [
  { to: '/admin', label: 'Главная' },
  { to: '/admin/products', label: 'Товары' },
  { to: '/admin/categories', label: 'Категории' },
  { to: '/admin/orders', label: 'Заказы' },
];

function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    api.get('/admin/me').catch(() => navigate('/admin/login'));
  }, [navigate]);

  useEffect(() => { setMobileNav(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="bg-white border-b border-[#E5E5E3] px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/admin" className="font-display text-lg sm:text-xl font-semibold">
            Lans Style
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? 'bg-[#F5F0EB] text-[#C4A882]'
                    : 'hover:bg-gray-50 text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="w-px h-5 bg-[#E5E5E3] mx-2" />
            <Link to="/" className="px-3 py-2 rounded-lg text-sm text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-gray-50 transition-colors">
              На сайт
            </Link>
            <button
              onClick={() => { localStorage.removeItem('admin_token'); navigate('/admin/login'); }}
              className="px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              Выход
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileNav && (
          <nav className="md:hidden pt-3 pb-1 border-t border-[#E5E5E3] mt-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? 'bg-[#F5F0EB] text-[#C4A882]'
                    : 'text-[#6B6B6B]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/" className="block px-3 py-2.5 rounded-lg text-sm text-[#6B6B6B]">
              На сайт
            </Link>
            <button
              onClick={() => { localStorage.removeItem('admin_token'); navigate('/admin/login'); }}
              className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-500"
            >
              Выход
            </button>
          </nav>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}

export { AdminLayout };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8">Панель управления</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Товаров', value: stats.totalProducts, color: 'bg-blue-50 text-blue-700' },
            { label: 'Новых заказов', value: stats.newOrders, color: 'bg-green-50 text-green-700' },
            { label: 'Оптовых заявок', value: stats.totalWholesale, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Посещений', value: stats.recentVisits, color: 'bg-purple-50 text-purple-700' },
          ].map((item) => (
            <div key={item.label} className={`${item.color} rounded-2xl p-4 sm:p-6`}>
              <p className="text-xs sm:text-sm font-medium opacity-70">{item.label}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {[
          { to: '/admin/products', title: 'Управление товарами', desc: 'Добавление, редактирование, удаление' },
          { to: '/admin/categories', title: 'Категории', desc: 'Управление категориями каталога' },
          { to: '/admin/orders', title: 'Заказы и заявки', desc: 'Просмотр заказов и оптовых заявок' },
        ].map((card) => (
          <Link key={card.to} to={card.to} className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E5E3] hover:border-[#C4A882] transition-colors">
            <h3 className="font-medium mb-1">{card.title}</h3>
            <p className="text-sm text-[#6B6B6B]">{card.desc}</p>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
