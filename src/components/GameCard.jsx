import { Package } from 'lucide-react'

const EXCLUDED_CATEGORIES = ['牌套', '周邊']
const CATEGORY_LABEL = { '牌套': '🛡️ 牌套', '周邊': '🎁 周邊' }

export default function GameCard({ game, onClick }) {
  const isExcluded = EXCLUDED_CATEGORIES.includes(game.category)
  const memberPrice = Math.floor((game.price || 0) * 0.9)
  const outOfStock = (game.stock || 0) === 0

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package size={48} />
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full">
              暫時缺貨
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 flex-1">
            {game.name}
          </h3>
          {isExcluded && (
            <span className="shrink-0 text-xs bg-blue-50 text-blue-500 rounded-full px-2 py-0.5">
              {CATEGORY_LABEL[game.category]}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-400 mb-2 space-y-0.5">
          {game.players && <div>遊戲人數：{game.players}人</div>}
          {game.minAge && <div>適合年齡：{game.minAge}+</div>}
        </div>

        <div className="text-xs text-gray-500 mb-2">
          庫存：<span className={`font-semibold ${outOfStock ? 'text-red-500' : 'text-gray-700'}`}>
            {game.stock ?? 0}
          </span>
        </div>

        <div className="border-t border-gray-100 pt-2 space-y-0.5">
          {game.price > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">售價</span>
              <span className="text-gray-700">NT$ {game.price.toLocaleString()}</span>
            </div>
          )}
          {game.price > 0 && !isExcluded && (
            <div className="flex justify-between text-xs">
              <span className="text-orange-500 font-medium">會員9折</span>
              <span className="text-orange-600 font-semibold">NT$ {memberPrice.toLocaleString()}</span>
            </div>
          )}
          {game.rental > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">租金</span>
              <span className="text-gray-700">NT$ {game.rental.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
