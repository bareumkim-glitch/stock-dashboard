// api/stock-data.js
// Yahoo Finance v7 quote API (crumb 인증) + v8 chart API 폴백

const SYMBOLS = ['^KS11', '102110.KS', '^VIX', 'KRW=X'];
const NAME_MAP = {
  '^KS11': 'KOSPI',
  '102110.KS': 'TIGER 200',
  '^VIX': 'VIX 지수',
  'KRW=X': '원/달러',
};

// Yahoo Finance crumb/cookie 캐시 (서버리스 인스턴스 수명 동안 유지)
let authCache = { cookie: null, crumb: null, expiresAt: 0 };

// Yahoo Finance 인증 (crumb + cookie)
async function getYahooAuth() {
  if (authCache.crumb && authCache.expiresAt > Date.now()) {
    return authCache;
  }

  // 1단계: 쿠키 획득
  const cookieRes = await fetch('https://fc.yahoo.com/', { redirect: 'manual' });
  const setCookie = cookieRes.headers.get('set-cookie') || '';
  const cookie = setCookie.split(';')[0];

  // 2단계: crumb 획득
  const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { Cookie: cookie, 'User-Agent': 'Mozilla/5.0' },
  });
  const crumb = await crumbRes.text();

  authCache = { cookie, crumb, expiresAt: Date.now() + 10 * 60 * 1000 }; // 10분 캐시
  return authCache;
}

// v7 quote API (실시간에 가까운 데이터)
async function fetchViaQuoteAPI(symbols) {
  const { cookie, crumb } = await getYahooAuth();
  const query = symbols.map(encodeURIComponent).join(',');
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${query}&crumb=${encodeURIComponent(crumb)}`;

  const response = await fetch(url, {
    headers: { Cookie: cookie, 'User-Agent': 'Mozilla/5.0' },
  });

  if (!response.ok) throw new Error(`Quote API ${response.status}`);

  const data = await response.json();
  const quotes = data.quoteResponse?.result;
  if (!quotes?.length) throw new Error('Empty quote response');

  return quotes.map((q) => ({
    symbol: q.symbol,
    price: q.regularMarketPrice,
    change: q.regularMarketChange,
    changePercent: q.regularMarketChangePercent,
    marketTime: q.regularMarketTime,
  }));
}

// v8 chart API (폴백)
async function fetchViaChartAPI(symbol) {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`
  );
  const data = await response.json();

  if (data.chart?.result?.[0]) {
    const meta = data.chart.result[0].meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.chartPreviousClose || meta.previousClose;

    if (currentPrice && previousClose) {
      return {
        symbol,
        price: currentPrice,
        change: currentPrice - previousClose,
        changePercent: ((currentPrice - previousClose) / previousClose) * 100,
        marketTime: meta.regularMarketTime,
      };
    }
  }
  return null;
}

// Vercel Handler
export default async function handler(req, res) {
  const allowedOrigin = 'https://stock-dashboard-eta-one.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let results = [];
  let source = 'Yahoo Finance (Quote API)';

  try {
    // 1차: v7 quote API (실시간)
    const quotes = await fetchViaQuoteAPI(SYMBOLS);
    results = quotes
      .filter((q) => q.price != null)
      .map((q) => ({ ...q, name: NAME_MAP[q.symbol] || q.symbol }));
  } catch (err) {
    console.error('Quote API failed, falling back to Chart API:', err.message);
    source = 'Yahoo Finance (Chart API)';

    // 2차: v8 chart API (폴백)
    const items = await Promise.all(SYMBOLS.map(fetchViaChartAPI));
    results = items
      .filter((item) => item !== null)
      .map((item) => ({ ...item, name: NAME_MAP[item.symbol] || item.symbol }));
  }

  try {
    res.status(200).json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      source,
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
