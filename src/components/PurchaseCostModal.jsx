import { X, TrendingDown } from 'lucide-react'

function formatMonth(yyyyMM) {
  const [year, month] = yyyyMM.split('-')
  return `${year}年${parseInt(month)}月`
}

export default function PurchaseCostModal({ records, thisMonth, onClose }) {
  const sorted = [...records].sort((a, b) => b.month.localeCompare(a.month))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col">
        {/* 標題 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingDown size={18} className="text-green-500" />
            <h2 className="font-semibold text-gray-800">進貨成本歷史</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* 清單 */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {sorted.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">尚無進貨成本紀錄</p>
          ) : (
            sorted.map(r => (
              <div
                key={r.month}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  r.month === thisMonth
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    {formatMonth(r.month)}
                    {r.month === thisMonth && (
                      <span className="ml-2 text-xs text-green-600 font-semibold">本月</span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  NT$ {r.amount.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 說明 */}
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            數值由進貨管理系統自動帶入
          </p>
        </div>
      </div>
    </div>
  )
}
