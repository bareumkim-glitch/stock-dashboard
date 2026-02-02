export const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5분
export const FETCH_TIMEOUT_MS = 15 * 1000; // 15초
export const MAX_RETRY_COUNT = 2;
export const RETRY_DELAY_MS = 3000; // 3초

export const INITIAL_INDICES = [
  { name: 'KOSPI', symbol: '^KS11', price: 0, change: 0, changePercent: 0, loading: true },
  { name: 'TIGER 200', symbol: '102110.KS', price: 0, change: 0, changePercent: 0, loading: true },
  { name: 'VIX 지수', symbol: '^VIX', price: 0, change: 0, changePercent: 0, loading: true },
  { name: '원/달러', symbol: 'KRW=X', price: 0, change: 0, changePercent: 0, loading: true },
];
