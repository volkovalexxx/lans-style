import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import api from '../api/client';

export default function Search() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    api.get('/products', { params: { search: query, page, limit: 12 } })
      .then((res) => {
        setProducts(res.data.products);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, page]);

  useEffect(() => { setPage(1); }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-semibold mb-2">
        {t('search.title')}
      </h1>
      <p className="text-[#6B6B6B] mb-8">
        {query && (
          <>
            {t('search.results_for')} <span className="font-medium text-[#1A1A1A]">«{query}»</span>
            {!loading && <span className="ml-2">({total})</span>}
          </>
        )}
      </p>

      {loading ? (
        <div className="text-center py-20 text-[#6B6B6B]">...</div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-[#1A1A1A] text-white'
                      : 'border border-[#E5E5E3] hover:border-[#C4A882]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-center py-20 text-[#6B6B6B]">{t('search.no_results')}</p>
      )}
    </div>
  );
}
