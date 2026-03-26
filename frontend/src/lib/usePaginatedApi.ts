import { useState, useEffect, useCallback } from 'react';
import apiClient from './api';

interface Options {
  url: string;
  limit?: number;
  initialSort?: string;
  initialDir?: 'ASC' | 'DESC';
  extraParams?: Record<string, string>;
}

export function usePaginatedApi<T>({ url, limit = 15, initialSort = 'createdAt', initialDir = 'DESC', extraParams = {} }: Options) {
  const [data,       setData]       = useState<T[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [sortBy,     setSortBy]     = useState(initialSort);
  const [sortDir,    setSortDir]    = useState<'ASC' | 'DESC'>(initialDir);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetch = useCallback(async (p = page, sb = sortBy, sd = sortDir) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(p), limit: String(limit),
        sortBy: sb, sortDir: sd,
        ...extraParams,
      });
      const res = await apiClient.get(`${url}?${params}`);
      setData(res.data.data ?? res.data);
      setTotal(res.data.total ?? res.data.length);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [url, limit, JSON.stringify(extraParams)]);

  useEffect(() => { fetch(1, sortBy, sortDir); setPage(1); }, [JSON.stringify(extraParams)]);

  const goToPage = (p: number) => { setPage(p); fetch(p, sortBy, sortDir); };

  const toggleSort = (col: string) => {
    const newDir = sortBy === col && sortDir === 'DESC' ? 'ASC' : 'DESC';
    setSortBy(col); setSortDir(newDir); setPage(1); fetch(1, col, newDir);
  };

  return { data, total, totalPages, page, sortBy, sortDir, loading, error, goToPage, toggleSort, refresh: () => fetch(page, sortBy, sortDir) };
}
