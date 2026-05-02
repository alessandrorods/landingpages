'use client'

import { useState } from 'react'
import { useOrders } from '@/app/admin/components/useOrders'
import StatusBar from '@/app/admin/components/StatusBar'
import EmptyState from '@/app/admin/components/EmptyState'
import type { TinyPedidoCompleto } from '@/lib/olist/types'

function PedidoCard({ p, onMontado }: { p: TinyPedidoCompleto; onMontado: (id: number) => void }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const endereco = p.enderecos?.[0]?.endereco ?? p.endereco_entrega
  const produto = p.itens?.[0]?.item?.descricao ?? '—'
  const destinatario = endereco?.nome_destinatario
  const mesmaPessoa = !destinatario || destinatario === p.cliente?.nome

  async function marcarMontado() {
    setLoading(true)
    setErr('')
    try {
      const res = await fetch(`/api/admin/orders/${p.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: 'preparando_envio' }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErr(d.error ?? 'Erro ao atualizar')
        return
      }
      setDone(true)
      setTimeout(() => onMontado(p.id), 600)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-3 text-center">
        <p className="text-green-700 font-semibold">✓ Montado!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-gray-900 leading-tight">{produto}</p>
          <p className="text-xs text-gray-400 mt-0.5">Pedido #{p.numero}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-gray-700">{p.data_prevista}</p>
          {p.forma_frete && <p className="text-xs text-gray-400">{p.forma_frete}</p>}
        </div>
      </div>

      <div className="border-t border-gray-50 pt-2 mt-2 space-y-1">
        <p className="text-sm text-gray-600">
          <span className="text-gray-400 text-xs">Comprador:</span> {p.cliente?.nome}
        </p>
        {!mesmaPessoa && (
          <p className="text-sm text-gray-600">
            <span className="text-gray-400 text-xs">Para:</span>{' '}
            <span className="font-medium">{destinatario}</span>
          </p>
        )}
        {endereco?.bairro && (
          <p className="text-sm text-gray-500 text-xs">{endereco.bairro}, {endereco.cidade}</p>
        )}
      </div>

      {p.obs_internas && (
        <div className="mt-3 bg-pink-50 border border-pink-100 rounded-xl px-3 py-2">
          <p className="text-xs text-pink-500 font-semibold mb-0.5">Mensagem do cartão</p>
          <p className="text-sm text-pink-900 italic">{p.obs_internas}</p>
        </div>
      )}

      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}

      <button
        onClick={marcarMontado}
        disabled={loading}
        className="mt-3 w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-base transition-colors"
      >
        {loading ? 'Atualizando...' : '✓ Montado'}
      </button>
    </div>
  )
}

export default function FloristaPage() {
  const { pedidos, loading, error, lastUpdate, refresh } = useOrders('aprovado')
  const [ids, setIds] = useState<Set<number>>(new Set())

  const visiveis = pedidos.filter((p) => !ids.has(p.id))

  function remover(id: number) {
    setIds((prev) => new Set([...prev, id]))
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Montagem</h1>

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
        <EmptyState icon="🌸" message="Todos os pedidos estão montados!" />
      )}

      {!loading && visiveis.map((p) => <PedidoCard key={p.id} p={p} onMontado={remover} />)}
    </div>
  )
}
