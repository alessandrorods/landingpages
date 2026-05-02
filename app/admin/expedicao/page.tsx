'use client'

import { useState } from 'react'
import { useOrders } from '@/app/admin/components/useOrders'
import StatusBar from '@/app/admin/components/StatusBar'
import EmptyState from '@/app/admin/components/EmptyState'
import OrderDrawer from '@/app/admin/components/OrderDrawer'
import type { TinyPedidoCompleto } from '@/lib/olist/types'

function PedidoCard({ p, onOpen }: { p: TinyPedidoCompleto; onOpen: () => void }) {
  const produto = p.itens?.[0]?.item?.descricao ?? '—'
  const endereco = p.enderecos?.[0]?.endereco ?? p.endereco_entrega

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold font-mono text-gray-900 bg-blue-50 px-3 py-1 rounded-xl leading-none">
          #{p.numero}
        </span>
        {p.data_prevista && (
          <span className="text-xs text-gray-500 font-medium">{p.data_prevista}</span>
        )}
      </div>

      <p className="font-semibold text-gray-900">
        {endereco?.nome_destinatario ?? p.cliente?.nome}
      </p>
      <p className="text-sm text-gray-500 mt-0.5">{produto}</p>

      {endereco?.bairro && (
        <p className="text-xs text-gray-400 mt-2 bg-gray-50 rounded-lg px-2 py-1 inline-block">
          {endereco.bairro}
        </p>
      )}

      <div className="flex justify-end mt-2">
        <span className="text-xs text-blue-600 font-semibold">Ver endereço ›</span>
      </div>
    </button>
  )
}

function EnviadoAction({
  p,
  onEnviado,
}: {
  p: TinyPedidoCompleto
  onEnviado: (id: number) => void
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  async function marcar() {
    setLoading(true)
    setErr('')
    try {
      const res = await fetch(`/api/admin/orders/${p.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: 'enviado' }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErr(d.error ?? 'Erro ao atualizar')
        return
      }
      setDone(true)
      setTimeout(() => onEnviado(p.id), 800)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <p className="text-center text-blue-700 font-semibold py-3">🚚 Pedido saiu para entrega!</p>
    )
  }

  return (
    <>
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      <button
        onClick={marcar}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        {loading ? 'Atualizando...' : '🚚 Saiu para Entrega'}
      </button>
    </>
  )
}

export default function ExpedicaoPage() {
  const { pedidos, loading, error, lastUpdate, refresh } = useOrders('preparando_envio')
  const [aberto, setAberto] = useState<TinyPedidoCompleto | null>(null)
  const [removidos, setRemovidos] = useState<Set<number>>(new Set())

  const visiveis = pedidos.filter((p) => !removidos.has(p.id))

  function remover(id: number) {
    setAberto(null)
    setRemovidos((prev) => new Set([...prev, id]))
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Expedição</h1>

      <StatusBar count={visiveis.length} lastUpdate={lastUpdate} onRefresh={refresh} loading={loading} />

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-28" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{error}</p>
      )}

      {!loading && !error && visiveis.length === 0 && (
        <EmptyState icon="🚀" message="Nenhum pedido aguardando expedição" />
      )}

      {!loading && visiveis.map((p) => (
        <PedidoCard key={p.id} p={p} onOpen={() => setAberto(p)} />
      ))}

      {aberto && (
        <OrderDrawer
          pedido={aberto}
          onClose={() => setAberto(null)}
          action={<EnviadoAction p={aberto} onEnviado={remover} />}
        />
      )}
    </div>
  )
}
