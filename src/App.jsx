import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, LogOut, AlertCircle } from 'lucide-react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// API 엔드포인트 (로컬 개발 vs 프로덕션)
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Vercel 배포 시
  : 'http://localhost:3000/api';  // 로컬 개발 시

const StockDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [dataError, setDataError] = useState('');

  // 실제 데이터
  const [marketData, setMarketData] = useState({
    indices: [
      { name: 'KOSPI', code: '0001', type: 'index', price: 0, change: 0, changePercent: 0, loading: true },
      { name: 'TIGER 200', code: '102110', type: 'stock', price: 0, change: 0, changePercent: 0, loading: true },
      { name: 'VIX 지수', code: 'VIX', type: 'foreign', price: 0, change: 0, changePercent: 0, loading: true },
      { name: '원/달러', code: 'FX@KRW', type: 'forex', price: 0, change: 0, changePercent: 0, loading: true },
    ]
  });

  // Firebase 인증 상태 감시
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchAllData();
      }
    });

    return () => unsubscribe();
  }, []);

  // 모든 데이터 가져오기
  const fetchAllData = async () => {
    setLoading(true);
    setDataError('');

    try {
      // 한국 시장 데이터 (백엔드 API 사용)
      await Promise.all([
        fetchFromBackend('index', '0001', 'KOSPI'),
        fetchFromBackend('stock', '102110', 'TIGER 200'),
      ]);

      // 해외 데이터 (직접 호출)
      await fetchVIX();
      await fetchForex();

      setLastUpdate(new Date());
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      setDataError('일부 데이터를 가져오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 백엔드 API에서 데이터 가져오기
  const fetchFromBackend = async (type, code, name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/kis-proxy?type=${type}&code=${code}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      updateMarketData(code, {
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        loading: false
      });
    } catch (error) {
      console.error(`${name} 데이터 오류:`, error);
      updateMarketData(code, { loading: false });
    }
  };

  // VIX 지수 (Yahoo Finance)
  const fetchVIX = async () => {
    try {
      const response = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/^VIX?interval=1d&range=1d'
      );
      const data = await response.json();
      
      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        updateMarketData('VIX', {
          price: currentPrice,
          change: change,
          changePercent: changePercent,
          loading: false
        });
      }
    } catch (error) {
      console.error('VIX 데이터 오류:', error);
      updateMarketData('VIX', { loading: false });
    }
  };

  // 원/달러 환율
  const fetchForex = async () => {
    try {
      const response = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1d&range=1d'
      );
      const data = await response.json();
      
      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        updateMarketData('FX@KRW', {
          price: currentPrice,
          change: change,
          changePercent: changePercent,
          loading: false
        });
      }
    } catch (error) {
      console.error('환율 데이터 오류:', error);
      updateMarketData('FX@KRW', { loading: false });
    }
  };

  // 데이터 업데이트 헬퍼 함수
  const updateMarketData = (code, newData) => {
    setMarketData(prev => ({
      ...prev,
      indices: prev.indices.map(index => 
        index.code === code 
          ? { ...index, ...newData }
          : index
      )
    }));
  };

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('로그인 오류:', error);
      
      let errorMessage = '로그인에 실패했습니다.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 사용자입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      }
      
      setLoginError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 5분마다 자동 새로고침
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchAllData();
      }, 300000); // 5분
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">📈 시장 대시보드</h1>
            <p className="text-slate-400">로그인하여 접속하세요</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                placeholder="your-email@gmail.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-lg px-4 py-3 text-sm">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center text-slate-500 text-xs">
            <p>※ Firebase Authentication으로 보호됨</p>
            <p className="mt-1">승인된 사용자만 접근 가능합니다</p>
          </div>
        </div>
      </div>
    );
  }

  // 로그인한 경우 대시보드 표시
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-[1024px] mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              📈 시장 대시보드
            </h1>
            <p className="text-slate-400 text-sm">
              마지막 업데이트: {formatTime(lastUpdate)}
              {loading && <span className="ml-2 text-blue-400">업데이트 중...</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {dataError && (
          <div className="mb-4 bg-yellow-500/20 border border-yellow-500 text-yellow-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {dataError}
          </div>
        )}

        {/* 주요 지수 카드 - 2x2 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          {marketData.indices.map((index, idx) => (
            <div 
              key={idx}
              className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-all hover:shadow-xl"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-slate-400 text-xs font-medium">{index.code}</h3>
                  <h2 className="text-white text-xl font-bold">{index.name}</h2>
                </div>
                <div className={`p-2 rounded-lg ${
                  index.change >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {index.loading ? (
                    <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                  ) : index.change >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  {index.loading ? (
                    <span className="text-slate-500">로딩 중...</span>
                  ) : index.price > 0 ? (
                    index.price.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
                  ) : (
                    <span className="text-slate-500">데이터 없음</span>
                  )}
                </div>
                {!index.loading && index.price > 0 && (
                  <div className={`flex items-center gap-2 text-base font-semibold ${
                    index.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <span>{index.change >= 0 ? '+' : ''}{index.change.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}</span>
                    <span>({index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 푸터 정보 */}
        <div className="mt-6 text-center text-slate-500 text-xs">
          <p className="text-slate-400 mb-1">로그인: {user.email}</p>
          <p>※ 한국투자증권 OpenAPI + Yahoo Finance 실시간 데이터</p>
          <p className="mt-1">※ 5분마다 자동 업데이트</p>
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;