// api/kis-proxy.js
// Vercel Serverless Function - 한국투자증권 API 프록시

// 환경 변수에서 API 키 가져오기
const KIS_CONFIG = {
  appKey: process.env.KIS_APP_KEY,
  appSecret: process.env.KIS_APP_SECRET,
  baseUrl: 'https://openapi.koreainvestment.com:9443',
};

// Access Token 캐시 (메모리)
let tokenCache = {
  token: null,
  expiresAt: null,
};

// Access Token 발급
async function getAccessToken() {
  // 캐시된 토큰이 유효하면 재사용
  if (tokenCache.token && tokenCache.expiresAt > Date.now()) {
    console.log('Using cached token');
    return tokenCache.token;
  }

  try {
    const response = await fetch(`${KIS_CONFIG.baseUrl}/oauth2/tokenP`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: KIS_CONFIG.appKey,
        appsecret: KIS_CONFIG.appSecret,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      // 토큰 캐시 (2시간 - 10분 = 110분)
      tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (110 * 60 * 1000),
      };
      console.log('New token issued');
      return data.access_token;
    } else {
      throw new Error('Token issuance failed');
    }
  } catch (error) {
    console.error('Access Token Error:', error);
    throw error;
  }
}

// KOSPI 지수 조회
async function fetchKospiIndex(accessToken) {
  const response = await fetch(
    `${KIS_CONFIG.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-index-price?fid_cond_mrkt_div_code=U&fid_input_iscd=0001`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${accessToken}`,
        'appkey': KIS_CONFIG.appKey,
        'appsecret': KIS_CONFIG.appSecret,
        'tr_id': 'FHKUP03500100',
      },
    }
  );

  const data = await response.json();
  
  if (data.rt_cd === '0' && data.output) {
    const output = data.output;
    return {
      code: '0001',
      name: 'KOSPI',
      price: parseFloat(output.bstp_nmix_prpr),
      change: parseFloat(output.bstp_nmix_prdy_vrss),
      changePercent: parseFloat(output.prdy_vrss_sign === '2' ? 
        output.bstp_nmix_prdy_ctrt : `-${output.bstp_nmix_prdy_ctrt}`),
    };
  }
  
  throw new Error('KOSPI data not available');
}

// 한국 주식 조회
async function fetchKoreanStock(accessToken, code) {
  const response = await fetch(
    `${KIS_CONFIG.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?fid_cond_mrkt_div_code=J&fid_input_iscd=${code}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${accessToken}`,
        'appkey': KIS_CONFIG.appKey,
        'appsecret': KIS_CONFIG.appSecret,
        'tr_id': 'FHKST01010100',
      },
    }
  );

  const data = await response.json();
  
  if (data.rt_cd === '0' && data.output) {
    const output = data.output;
    return {
      code: code,
      name: output.hts_kor_isnm,
      price: parseFloat(output.stck_prpr),
      change: parseFloat(output.prdy_vrss),
      changePercent: parseFloat(output.prdy_vrss_sign === '2' ? 
        output.prdy_ctrt : `-${output.prdy_ctrt}`),
    };
  }
  
  throw new Error(`Stock ${code} data not available`);
}

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  // CORS 헤더 설정
  const allowedOrigin = 'https://stock-dashboard-eta-one.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET 요청만 허용
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Access Token 발급
    const accessToken = await getAccessToken();

    // 쿼리 파라미터에서 종목 코드 가져오기
    const { type, code } = req.query;

    let result;

    if (type === 'index' && code === '0001') {
      // KOSPI 지수
      result = await fetchKospiIndex(accessToken);
    } else if (type === 'stock' && code) {
      // 개별 주식
      result = await fetchKoreanStock(accessToken, code);
    } else {
      res.status(400).json({ error: 'Invalid parameters' });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}