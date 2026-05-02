'use client'

import { useState } from 'react'
import { useOrders } from '@/app/admin/components/useOrders'
import StatusBar from '@/app/admin/components/StatusBar'
import EmptyState from '@/app/admin/components/EmptyState'
import type { TinyPedidoCompleto } from '@/lib/olist/types'

function PedidoCard({ p, onEnviado }: { p: TinyPedidoCompleto; onEnviado: (id: number) => void }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const endereco = p.enderecos?.[0]?.endereco ?? p.endereco_entrega
  const produto = p.itens?.[0]?.item?.descricao ?? '—'

  async function marcarEnviado() {
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
      setTimeout(() => onEnviado(p.id), 600)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3 text-center">
        <p className="text-blue-700 font-semibold">🚚 Saiu para entrega!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-gray-900 leading-tight">
            {endereco?.nome_destinatario ?? p.cliente?.nome}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Pedido #{p.numero}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-gray-700">{p.data_prevista}</p>
          {p.forma_frete && <p className="text-xs text-gray-400">{p.forma_frete}</p>}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-2">{produto}</p>

      {endereco && (
        <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-0.5">
          <p className="text-sm font-medium text-gray-800">
            {endereco.endereco}, {endereco.numero}
            {endereco.complemento ? ` - ${endereco.complemento}` : ''}
          </p>
          <p className="text-sm text-gray-600">{endereco.bairro}</p>
          <p className="text-xs text-gray-400">CEP {endereco.cep} · {endereco.cidade}/{endereco.uf}</p>
          {endereco.fone && (
            <a
              href={`tel:${endereco.fone.replace(/\D/g, '')}`}
              className="text-xs text-blue-600 font-medium"
            >
              {endereco.fone}
            </a>
          )}
        </div>
      )}

      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}

      <button
        onClick={marcarEnviado}
        disabled={loading}
        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-base transition-colors"
      >
        {loading ? 'Atualizando...' : '🚚 Saiu para Entrega'}
      </button>
    </div>
  )
}

export default function ExpedicaoPage() {
  const { pedidos, loading, error, lastUpdate, refresh } = useOrders('preparando_envio')
  const [ids, setIds] = useState<Set<number>>(new Set())

  const visiveis = pedidos.filter((p) => !ids.has(p.id))

  function remover(id: number) {
    setIds((prev) => new Set([...prev, id]))
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Expedição</h1>

      <StatusBar count={visiveis.length} lastUpdate={lastUpdate} onRefresh={refresh} loading={loading} />

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-36" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{error}</p>
      )}

      {!loading && !error && visiveis.length === 0 && (
        <EmptyState icon="🚀" message="Nenhum pedido aguardando expedição" />
      )}

      {!loading && visiveis.map((p) => <PedidoCard key={p.id} p={p} onEnviado={remover} />)}
    </div>
  )
}
