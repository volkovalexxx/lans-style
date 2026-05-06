import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60_000;

export function useApi<T>(url: string, params?: Record<string, any>) {
  const key = url + '|' + JSON.stringify(params ?? {});

  const getCached = (): T | null => {
    const hit = cache.get(key);
    return hit && Date.now() - hit.ts < CACHE_TTL ? (hit.data as T) : null;
  };

  const [data, setData] = useState<T | null>(getCached);
  const [loading, setLoading] = useState<boolean>(() => getCached() === null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async (force = false) => {
    if (!force) {
      const hit = cache.get(key);
      if (hit && Date.now() - hit.ts < CACHE_TTL) {
        if (mountedRef.current) {
          setData(hit.data as T);
          setLoading(false);
        }
        return;
      }
    }
    if (mountedRef.current) setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params });
      cache.set(key, { data: res.data, ts: Date.now() });
      if (mountedRef.current) setData(res.data);
    } catch (err: any) {
      if (mountedRef.current) setError(err.response?.data?.error || 'Error fetching data');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: () => fetchData(true) };
}
