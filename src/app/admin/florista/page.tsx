'use client'

import { useState } from 'react'
import { useOrders } from '@/app/admin/components/useOrders'
import StatusBar from '@/app/admin/components/StatusBar'
import EmptyState from '@/app/admin/components/EmptyState'
import OrderDrawer from '@/app/admin/components/OrderDrawer'
import type { OlistOrderDetails } from '@/clients/olist/types'
import { DeliveryLabel } from '@/app/admin/components/DeliveryLabel'

function PedidoCard({ p, onOpen }: { p: OlistOrderDetails; onOpen: () => void }) {
  const produto = p.itens?.[0]?.item?.descricao ?? '—'
  const endereco = p.enderecos?.[0]?.endereco ?? p.endereco_entrega
  const destinatario = endereco?.nome_destinatario
  const mesmaPessoa = !destinatario || destinatario === p.cliente?.nome

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-mono text-gray-900 bg-pink-50 px-3 py-1 rounded-xl leading-none">
            #{p.numero}
          </span>
          <DeliveryLabel data={p.data_prevista} />
        </div>
        {p.obs_interna && (
          <span className="text-xs bg-pink-100 text-pink-700 font-semibold px-2 py-0.5 rounded-full">
            Tem mensagem
          </span>
        )}
      </div>

      <p className="font-semibold text-gray-900">{produto}</p>
      <p className="text-sm text-gray-500 mt-0.5">
        {mesmaPessoa ? p.cliente?.nome : `Para: ${destinatario}`}
      </p>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-pink-600 font-semibold">Montar ›</span>
      </div>
    </button>
  )
}

function MontadoAction({
  p,
  onMontado,
}: {
  p: OlistOrderDetails
  onMontado: (id: number) => void
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
        body: JSON.stringify({ situacao: 'pronto_envio' }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErr(d.error ?? 'Erro ao atualizar')
        return
      }
      setDone(true)
      setTimeout(() => onMontado(p.id), 800)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <p className="text-center text-green-700 font-semibold py-3">✓ Marcado como montado!</p>
    )
  }

  return (
    <>
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      <button
        onClick={marcar}
        disabled={loading}
        className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        {loading ? 'Atualizando...' : '✓ Montado — passar para Expedição'}
      </button>
    </>
  )
}

export default function FloristaPage() {
  const { pedidos, loading, error, lastUpdate, nextRefreshAt, refresh } = useOrders('aprovado')
  const [aberto, setAberto] = useState<OlistOrderDetails | null>(null)
  const [removidos, setRemovidos] = useState<Set<number>>(new Set())

  const visiveis = pedidos.filter((p) => !removidos.has(p.id))

  function remover(id: number) {
    setAberto(null)
    setRemovidos((prev) => new Set([...prev, id]))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Montagem</h1>

      <StatusBar count={visiveis.length} lastUpdate={lastUpdate} nextRefreshAt={nextRefreshAt} onRefresh={refresh} loading={loading} />

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
        <EmptyState icon="🌸" message="Todos os pedidos estão montados!" />
      )}

      {!loading && visiveis.map((p) => (
        <PedidoCard key={p.id} p={p} onOpen={() => setAberto(p)} />
      ))}

      {aberto && (
        <OrderDrawer
          pedido={aberto}
          onClose={() => setAberto(null)}
          action={<MontadoAction p={aberto} onMontado={remover} />}
        />
      )}
    </div>
  )
}
