import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineShoppingBag, HiOutlineHeart, HiOutlineBars3, HiOutlineXMark, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { useCartStore } from '../../store/cartStore';
import { useFavStore } from '../../store/favStore';
import LanguageSwitcher from '../LanguageSwitcher';
import SearchBar from '../SearchBar';

export default function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');
  const cartCount = useCartStore((s) => s.totalItems());
  const favCount = useFavStore((s) => s.items.length);

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/catalog', label: t('nav.catalog') },
    { to: '/wholesale', label: t('nav.wholesale') },
    { to: '/about', label: t('nav.about') },
    { to: '/contacts', label: t('nav.contacts') },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-[#E5E5E3] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 min-[1200px]:h-20">
          {/* Logo */}
          <Link to="/" style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.05, textDecoration: 'none' }}>
            {/* "L" slightly bigger than "ANS" */}
            <span style={{ fontFamily: 'var(--font-logo)', fontWeight: 300, letterSpacing: '0.2em', color: '#1A1A1A' }}>
              <span style={{ fontSize: 'clamp(1.28rem, 2.1vw, 1.58rem)' }}>L</span>
              <span style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)' }}>ANS</span>
            </span>
            {/* "S" slightly bigger than "TYLE" */}
            <span style={{ fontFamily: 'var(--font-logo)', fontWeight: 300, letterSpacing: '0.18em', color: '#1A1A1A' }}>
              <span style={{ fontSize: 'clamp(1.68rem, 2.75vw, 2.08rem)' }}>S</span>
              <span style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2rem)' }}>TYLE</span>
            </span>
          </Link>

          {/* Desktop Nav (≥1200px) */}
          <nav className="hidden min-[1200px]:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-[#C4A882] ${
                  location.pathname === link.to ? 'text-[#C4A882]' : 'text-[#6B6B6B]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search + language/currency (≥768px) */}
            <div className="hidden md:flex items-center gap-2">
              <SearchBar />
              <LanguageSwitcher />
            </div>

            <Link to="/favorites" className="relative p-2 hover:text-[#C4A882] transition-colors">
              <HiOutlineHeart className="w-6 h-6" />
              {favCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C4A882] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {favCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 hover:text-[#C4A882] transition-colors">
              <HiOutlineShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1A1A1A] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Hamburger menu toggle (<1200px) */}
            <button
              className="min-[1200px]:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Expandable nav (<1200px) */}
        {mobileOpen && (
          <nav className="min-[1200px]:hidden pb-4 border-t border-[#E5E5E3] pt-4 space-y-3">
            {/* Search — only below 768 (above, it's in the header already) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mobileQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(mobileQuery.trim())}`);
                  setMobileOpen(false);
                  setMobileQuery('');
                }
              }}
              className="md:hidden flex items-center border border-[#E5E5E3] rounded-full px-3 py-2"
            >
              <HiOutlineMagnifyingGlass className="w-4 h-4 text-[#6B6B6B] mr-2 flex-shrink-0" />
              <input
                type="text"
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="text-sm bg-transparent outline-none flex-1"
              />
            </form>

            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block text-sm font-medium py-1 ${
                  location.pathname === link.to ? 'text-[#C4A882]' : 'text-[#6B6B6B]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Language + currency — only below 768 */}
            <div className="md:hidden pt-2 border-t border-[#E5E5E3]">
              <LanguageSwitcher />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
