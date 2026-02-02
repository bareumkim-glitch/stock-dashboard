import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AUTO_REFRESH_MS,
  FETCH_TIMEOUT_MS,
  MAX_RETRY_COUNT,
  RETRY_DELAY_MS,
  INITIAL_INDICES,
} from '../constants';

function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useMarketData(isActive) {
  const [marketData, setMarketData] = useState({ indices: INITIAL_INDICES });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [dataError, setDataError] = useState('');
  const [dataSource, setDataSource] = useState('');
  const isFetchingRef = useRef(false);

  const fetchAllData = useCallback(async (retryCount = 0) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setDataError('');

    try {
      const response = await fetchWithTimeout('/api/stock-data', FETCH_TIMEOUT_MS);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setMarketData((prev) => ({
          ...prev,
          indices: prev.indices.map((index) => {
            const updated = result.data.find((d) => d.symbol === index.symbol);
            return updated
              ? { ...index, price: updated.price, change: updated.change, changePercent: updated.changePercent, loading: false }
              : { ...index, loading: false };
          }),
        }));
        setLastUpdate(new Date());
        if (result.source) setDataSource(result.source);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      if (retryCount < MAX_RETRY_COUNT) {
        isFetchingRef.current = false;
        await delay(RETRY_DELAY_MS);
        return fetchAllData(retryCount + 1);
      }

      console.error('데이터 가져오기 오류:', error);
      const message =
        error.name === 'AbortError'
          ? '서버 응답 시간이 초과되었습니다. 새로고침을 시도해주세요.'
          : '데이터를 가져오는 데 실패했습니다. 새로고침을 시도해주세요.';
      setDataError(message);

      setMarketData((prev) => ({
        ...prev,
        indices: prev.indices.map((index) => ({ ...index, loading: false })),
      }));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // 로그인 시 초기 fetch
  useEffect(() => {
    if (isActive) {
      fetchAllData();
    }
  }, [isActive, fetchAllData]);

  // 자동 새로고침
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(fetchAllData, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [isActive, fetchAllData]);

  return { marketData, loading, lastUpdate, dataError, dataSource, fetchAllData };
}
