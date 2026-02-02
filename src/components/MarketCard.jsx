import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export default function MarketCard({ data }) {
  const isPositive = data.change >= 0;

  return (
    <article className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-all hover:shadow-xl">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-slate-400 text-xs font-medium">{data.symbol}</h3>
          <h2 className="text-white text-xl font-bold">{data.name}</h2>
        </div>
        <div
          className={`p-2 rounded-lg ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}
          aria-hidden="true"
        >
          {data.loading ? (
            <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
          ) : isPositive ? (
            <TrendingUp className="w-5 h-5 text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-400" />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold text-white">
          {data.loading ? (
            <span className="text-slate-500">로딩 중...</span>
          ) : data.price > 0 ? (
            data.price.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
          ) : (
            <span className="text-slate-500">데이터 없음</span>
          )}
        </div>
        {!data.loading && data.price > 0 && (
          <div
            className={`flex items-center gap-2 text-base font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}
            aria-label={`${isPositive ? '상승' : '하락'} ${Math.abs(data.changePercent).toFixed(2)}%`}
          >
            <span>
              {isPositive ? '+' : ''}
              {data.change.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
            </span>
            <span>
              ({isPositive ? '+' : ''}
              {data.changePercent.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
