'use client'

interface Props {
  count: number
  lastUpdate: Date | null
  onRefresh: () => void
  loading: boolean
}

export default function StatusBar({ count, lastUpdate, onRefresh, loading }: Props) {
  const time = lastUpdate
    ? lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-800">{count}</span>{' '}
        {count === 1 ? 'pedido' : 'pedidos'}
        {time && <span className="ml-1 text-gray-400">· {time}</span>}
      </p>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="text-sm text-green-700 font-medium disabled:opacity-40"
      >
        {loading ? '...' : '↻ Atualizar'}
      </button>
    </div>
  )
}
