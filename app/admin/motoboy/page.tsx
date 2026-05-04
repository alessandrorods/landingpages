'use client'

import { useState, useEffect } from 'react'
import { useOrders } from '@/app/admin/components/useOrders'
import StatusBar from '@/app/admin/components/StatusBar'
import EmptyState from '@/app/admin/components/EmptyState'
import OrderDrawer from '@/app/admin/components/OrderDrawer'
import type { TinyPedidoResumo, TinyPedidoCompleto } from '@/lib/olist/types'

const STORAGE_KEY = 'motoboy_nome'
const STORAGE_IDS_KEY = 'motoboy_ids'

// ── Helpers de localStorage ───────────────────────────────────────────────────

function getIds(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_IDS_KEY) ?? '[]') as number[]) }
  catch { return new Set() }
}

function addId(id: number) {
  const ids = getIds()
  ids.add(id)
  localStorage.setItem(STORAGE_IDS_KEY, JSON.stringify([...ids]))
}

function removeId(id: number) {
  const ids = getIds()
  ids.delete(id)
  localStorage.setItem(STORAGE_IDS_KEY, JSON.stringify([...ids]))
}

// ── Nome setup ────────────────────────────────────────────────────────────────

function NomeSetup({ onSalvar }: { onSalvar: (nome: string) => void }) {
  const [input, setInput] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const nome = input.trim()
    if (!nome) return
    localStorage.setItem(STORAGE_KEY, nome)
    onSalvar(nome)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-4xl mb-4">🏍️</p>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Qual é o seu nome?</h2>
      <p className="text-sm text-gray-500 mb-6">
        Vamos registrar quem fez cada entrega.
      </p>
      <form onSubmit={submit} className="w-full max-w-xs space-y-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Seu nome completo"
          autoFocus
          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          required
        />
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl text-base transition-colors"
        >
          Continuar
        </button>
      </form>
    </div>
  )
}

// ── Coletar pedido ────────────────────────────────────────────────────────────

function ColetarPedido({ motoboy, onColetado }: { motoboy: string; onColetado: (id: number, numero: string) => void }) {
  const [numero, setNumero] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = numero.trim()
    if (!n) return
    setLoading(true)
    setErr('')
    setDone(null)
    try {
      const res = await fetch('/api/admin/orders/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: n, motoboy }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Erro ao coletar pedido'); return }
      onColetado(data.id, String(data.numero))
      setDone(String(data.numero))
      setNumero('')
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Coletar pedido
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={numero}
          onChange={(e) => { setNumero(e.target.value); setErr(''); setDone(null) }}
          placeholder="Nº do pedido"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          required
        />
        <button
          type="submit"
          disabled={loading || !numero.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
        >
          {loading ? '...' : 'Coletar'}
        </button>
      </form>
      {done && (
        <p className="text-sm text-green-700 font-medium mt-2">
          ✓ Pedido #{done} marcado como saiu para entrega
        </p>
      )}
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </div>
  )
}

// ── Ação de entrega no drawer ─────────────────────────────────────────────────

function EntregaAction({
  pedido,
  motoboy,
  onEntregue,
}: {
  pedido: TinyPedidoCompleto
  motoboy: string
  onEntregue: (id: number) => void
}) {
  const endereco = pedido.enderecos?.[0]?.endereco ?? pedido.endereco_entrega
  const nomeDefault = endereco?.nome_destinatario ?? pedido.cliente?.nome ?? ''

  const [recebidoPor, setRecebidoPor] = useState(nomeDefault)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  async function confirmar() {
    if (!recebidoPor.trim()) return
    setLoading(true)
    setErr('')
    try {
      const res = await fetch(`/api/admin/orders/${pedido.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recebidoPor: recebidoPor.trim(), motoboy }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErr(d.error ?? 'Erro ao confirmar entrega')
        return
      }
      setDone(true)
      setTimeout(() => onEntregue(pedido.id), 800)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <p className="text-center text-orange-700 font-semibold py-3">
        ✓ Entrega confirmada!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Recebido por
        </label>
        <input
          type="text"
          value={recebidoPor}
          onChange={(e) => setRecebidoPor(e.target.value)}
          placeholder="Nome de quem recebeu"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        />
      </div>

      {err && <p className="text-xs text-red-600">{err}</p>}

      <button
        onClick={confirmar}
        disabled={loading || !recebidoPor.trim()}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        {loading ? 'Registrando...' : '✓ Confirmar Entrega'}
      </button>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

function PedidoCard({ p, onOpen }: { p: TinyPedidoResumo; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold font-mono text-gray-900 bg-orange-50 px-3 py-1 rounded-xl leading-none">
          #{p.numero}
        </span>
        {p.data_prevista && (
          <span className="text-xs text-gray-500 font-medium">{p.data_prevista}</span>
        )}
      </div>

      <p className="font-semibold text-gray-900">{p.nome}</p>

      <div className="flex justify-end mt-2">
        <span className="text-xs text-orange-600 font-semibold">Confirmar entrega ›</span>
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MotoboyPage() {
  const [motoboy, setMotoboy] = useState<string | undefined>(undefined)
  const [ids, setIds] = useState<Set<number>>(new Set())
  const [aberto, setAberto] = useState<TinyPedidoResumo | null>(null)
  const { pedidos, loading, error, lastUpdate, nextRefreshAt, refresh } = useOrders('enviado')

  useEffect(() => {
    setMotoboy(localStorage.getItem(STORAGE_KEY) ?? '')
    setIds(getIds())
  }, [])

  if (motoboy === undefined) {
    return <div className="py-16 text-center text-gray-300 text-sm">...</div>
  }

  if (!motoboy) {
    return <NomeSetup onSalvar={setMotoboy} />
  }

  function handleColetado(id: number) {
    addId(id)
    setIds(getIds())
    refresh()
  }

  function remover(id: number) {
    removeId(id)
    setIds(getIds())
    setAberto(null)
  }

  const visiveis = pedidos.filter((p) => ids.has(p.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Entregas</h1>
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY)
            setMotoboy('')
          }}
          className="text-xs text-gray-400 underline"
        >
          Trocar nome
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Motoboy: <span className="font-semibold text-gray-800">{motoboy}</span>
      </p>

      <ColetarPedido motoboy={motoboy} onColetado={handleColetado} />

      <StatusBar
        count={visiveis.length}
        lastUpdate={lastUpdate}
        nextRefreshAt={nextRefreshAt}
        onRefresh={refresh}
        loading={loading}
      />

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
        <EmptyState icon="🎉" message="Nenhuma entrega em rota" />
      )}

      {!loading &&
        visiveis.map((p) => (
          <PedidoCard key={p.id} p={p} onOpen={() => setAberto(p)} />
        ))}

      {aberto && (
        <OrderDrawer
          pedidoId={aberto.id}
          onClose={() => setAberto(null)}
          hideBuyer
          hidePrices
          hideCardMessage
          action={(p) => (
            <EntregaAction
              pedido={p}
              motoboy={motoboy}
              onEntregue={remover}
            />
          )}
        />
      )}
    </div>
  )
}
