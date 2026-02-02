// api/stock-data.js
// Yahoo Finance만 사용하는 간단한 버전

// Yahoo Finance에서 데이터 가져오기
async function fetchYahooFinance(symbol) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    );

    const data = await response.json();

    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;

      const currentPrice = meta.regularMarketPrice || meta.previousClose;
      const previousClose = meta.chartPreviousClose || meta.previousClose;

      if (currentPrice && previousClose) {
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        return {
          symbol: symbol,
          price: currentPrice,
          change: change,
          changePercent: changePercent,
        };
      }
    }
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
  }

  return null;
}

// Vercel Handler
export default async function handler(req, res) {
  // CORS 헤더
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

  try {
    // 모든 데이터 병렬로 가져오기
    const [kospi, tiger200, vix, forex] = await Promise.all([
      fetchYahooFinance('^KS11'),      // KOSPI
      fetchYahooFinance('102110.KS'),  // TIGER 200
      fetchYahooFinance('^VIX'),       // VIX
      fetchYahooFinance('KRW=X'),      // 원/달러
    ]);

    // 이름 매핑
    const nameMap = {
      '^KS11': 'KOSPI',
      '102110.KS': 'TIGER 200',
      '^VIX': 'VIX 지수',
      'KRW=X': '원/달러'
    };

    const results = [kospi, tiger200, vix, forex]
      .filter(item => item !== null)
      .map(item => ({
        ...item,
        name: nameMap[item.symbol] || item.symbol
      }));

    res.status(200).json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      source: 'Yahoo Finance'
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
