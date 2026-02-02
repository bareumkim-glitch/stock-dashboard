import { RefreshCw, LogOut, AlertCircle } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useMarketData } from './hooks/useMarketData';
import LoginForm from './components/LoginForm';
import MarketCard from './components/MarketCard';
import { AUTO_REFRESH_MS } from './constants';

const formatTime = (date) => {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export default function App() {
  const { user, isLoggingIn, loginError, login, logout } = useAuth();
  const { marketData, loading, lastUpdate, dataError, fetchAllData } = useMarketData(!!user);

  if (!user) {
    return <LoginForm onLogin={login} isLoggingIn={isLoggingIn} loginError={loginError} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-[1024px] mx-auto">
        {/* 헤더 */}
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              시장 대시보드
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
              aria-label="데이터 새로고침"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            <button
              onClick={logout}
              aria-label="로그아웃"
              className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </header>

        {/* 에러 메시지 */}
        {dataError && (
          <div role="alert" className="mb-4 bg-yellow-500/20 border border-yellow-500 text-yellow-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {dataError}
          </div>
        )}

        {/* 주요 지수 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {marketData.indices.map((index) => (
            <MarketCard key={index.symbol} data={index} />
          ))}
        </div>

        {/* 푸터 정보 */}
        <footer className="mt-6 text-center text-slate-500 text-xs">
          <p className="text-slate-400 mb-1">로그인: {user.email}</p>
          <p>Yahoo Finance 실시간 데이터</p>
          <p className="mt-1">{AUTO_REFRESH_MS / 60000}분마다 자동 업데이트</p>
        </footer>
      </div>
    </div>
  );
}
