'use client'

import { useState, useCallback } from 'react'
import { useOrders } from '@/app/admin/components/useOrders'
import StatusBar from '@/app/admin/components/StatusBar'
import EmptyState from '@/app/admin/components/EmptyState'
import OrderDrawer from '@/app/admin/components/OrderDrawer'
import type { TinyPedidoCompleto } from '@/lib/olist/types'
import { parseMotoboy } from '@/app/admin/lib/parseObs'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayBRT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function tinyDateToISO(d: string): string {
  // dd/mm/yyyy → yyyy-mm-dd
  const [dd, mm, yyyy] = d.split('/')
  return `${yyyy}-${mm}-${dd}`
}

function isToday(dataPrevista?: string): boolean {
  if (!dataPrevista) return false
  return tinyDateToISO(dataPrevista) === todayBRT()
}

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aguardando pagamento',
  aprovado: 'Pago',
  preparando_envio: 'Preparando',
  faturado: 'Faturado',
  pronto_envio: 'Pronto para envio',
  enviado: 'Saiu para entrega',
  entregue: 'Entregue',
  nao_entregue: 'Não entregue',
  cancelado: 'Cancelado',
}

function labelSituacao(situacao: string): string {
  const key = situacao.toLowerCase().replace(/\s+/g, '_')
  return STATUS_LABEL[key] ?? situacao
}

// ── Busca de pedido ───────────────────────────────────────────────────────────

function BuscaPedido() {
  const [numero, setNumero] = useState('')
  const [loading, setLoading] = useState(false)
  const [pedido, setPedido] = useState<TinyPedidoCompleto | null>(null)
  const [err, setErr] = useState('')
  const [drawerAberto, setDrawerAberto] = useState(false)

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    const n = numero.trim()
    if (!n) return
    setLoading(true)
    setErr('')
    setPedido(null)
    try {
      const res = await fetch(`/api/admin/orders/search?numero=${encodeURIComponent(n)}`)
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error ?? 'Erro ao buscar pedido')
        return
      }
      setPedido(data.pedido)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const motoboy = pedido ? parseMotoboy(pedido.obs) : null
  const endereco = pedido?.enderecos?.[0]?.endereco ?? pedido?.endereco_entrega

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Rastrear pedido
      </p>

      <form onSubmit={buscar} className="flex gap-2 mb-3">
        <input
          type="number"
          inputMode="numeric"
          value={numero}
          onChange={(e) => { setNumero(e.target.value); setErr(''); setPedido(null) }}
          placeholder="Nº do pedido"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          required
        />
        <button
          type="submit"
          disabled={loading || !numero.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? '...' : 'Buscar'}
        </button>
      </form>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {pedido && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-gray-900">#{pedido.numero}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {labelSituacao(pedido.situacao)}
              </span>
              <button
                onClick={() => { setPedido(null); setNumero('') }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
                aria-label="Fechar resultado"
              >
                ×
              </button>
            </div>
          </div>

          {pedido.data_prevista && (
            <p className="text-xs text-gray-500">Entrega prevista: <span className="font-medium text-gray-700">{pedido.data_prevista}</span></p>
          )}

          {endereco && (
            <p className="text-sm text-gray-700">
              {endereco.bairro} — {endereco.endereco}, {endereco.numero}
            </p>
          )}

          {motoboy && (
            <p className="text-sm text-gray-700">
              Motoboy: <span className="font-semibold">{motoboy}</span>
            </p>
          )}

          <button
            onClick={() => setDrawerAberto(true)}
            className="text-xs text-blue-600 font-semibold underline"
          >
            Ver detalhes completos
          </button>
        </div>
      )}

      {drawerAberto && pedido && (
        <OrderDrawer pedido={pedido} onClose={() => setDrawerAberto(false)} />
      )}
    </div>
  )
}

// ── Card da lista ─────────────────────────────────────────────────────────────

interface StatusConfig { label: string; headerCls: string; badgeCls: string }

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pronto_envio: {
    label: 'Prontos para envio',
    headerCls: 'text-blue-700',
    badgeCls: 'bg-blue-100 text-blue-700',
  },
  enviado: {
    label: 'Em rota',
    headerCls: 'text-orange-700',
    badgeCls: 'bg-orange-100 text-orange-700',
  },
  entregue: {
    label: 'Entregues',
    headerCls: 'text-green-700',
    badgeCls: 'bg-green-100 text-green-700',
  },
}

function PedidoCard({ p, onOpen }: { p: TinyPedidoCompleto; onOpen: () => void }) {
  const produto = p.itens?.[0]?.item?.descricao ?? '—'
  const endereco = p.enderecos?.[0]?.endereco ?? p.endereco_entrega
  const motoboy = parseMotoboy(p.obs)

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold font-mono text-gray-900 bg-blue-50 px-3 py-1 rounded-xl leading-none">
          #{p.numero}
        </span>
        {motoboy && (
          <span className="text-xs text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
            {motoboy}
          </span>
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
        <span className="text-xs text-blue-600 font-semibold">Ver detalhes ›</span>
      </div>
    </button>
  )
}

// ── Agrupamento por período ───────────────────────────────────────────────────

function groupByPeriodo(pedidos: TinyPedidoCompleto[]): [string, TinyPedidoCompleto[]][] {
  const map = new Map<string, TinyPedidoCompleto[]>()
  for (const p of pedidos) {
    const key = p.forma_frete?.trim() || 'Sem período'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
}

// ── Seção de status ───────────────────────────────────────────────────────────

function StatusSection({
  status,
  pedidos,
  onOpen,
}: {
  status: string
  pedidos: TinyPedidoCompleto[]
  onOpen: (p: TinyPedidoCompleto) => void
}) {
  const cfg = STATUS_CONFIG[status]
  const grupos = groupByPeriodo(pedidos)

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className={`text-base font-bold ${cfg.headerCls}`}>{cfg.label}</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>
          {pedidos.length}
        </span>
      </div>

      {grupos.map(([periodo, itens]) => (
        <div key={periodo} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-600">{periodo}</h3>
            <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-1.5 py-0.5 rounded-full">
              {itens.length}
            </span>
          </div>
          {itens.map((p) => (
            <PedidoCard key={p.id} p={p} onOpen={() => onOpen(p)} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExpedicaoPage() {
  const prontos  = useOrders('pronto_envio')
  const enviados = useOrders('enviado')
  const entregues = useOrders('entregue')

  const [aberto, setAberto] = useState<TinyPedidoCompleto | null>(null)

  const loading = prontos.loading || enviados.loading || entregues.loading
  const error = prontos.error || enviados.error || entregues.error

  const lastUpdate = [prontos.lastUpdate, enviados.lastUpdate, entregues.lastUpdate]
    .filter(Boolean)
    .reduce<Date | null>((latest, d) => (!latest || d! > latest ? d! : latest), null)

  const nextRefreshAt = [prontos.nextRefreshAt, enviados.nextRefreshAt, entregues.nextRefreshAt]
    .filter((n): n is number => n !== null)
    .reduce<number | null>((min, n) => (min === null || n < min ? n : min), null)

  const refresh = useCallback(() => {
    prontos.refresh()
    enviados.refresh()
    entregues.refresh()
  }, [prontos, enviados, entregues])

  const prontosFiltrados  = prontos.pedidos.filter((p) => isToday(p.data_prevista))
  const enviadosFiltrados  = enviados.pedidos.filter((p) => isToday(p.data_prevista))
  const entreguesFiltrados = entregues.pedidos.filter((p) => isToday(p.data_prevista))

  const total = prontosFiltrados.length + enviadosFiltrados.length + entreguesFiltrados.length
  const vazio = !loading && !error && total === 0

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Expedição</h1>

      <BuscaPedido />

      <StatusBar
        count={total}
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

      {vazio && (
        <EmptyState icon="📦" message="Nenhum pedido no dia atual" />
      )}

      {!loading && !error && (
        <>
          {prontosFiltrados.length > 0 && (
            <StatusSection status="pronto_envio" pedidos={prontosFiltrados} onOpen={setAberto} />
          )}
          {enviadosFiltrados.length > 0 && (
            <StatusSection status="enviado" pedidos={enviadosFiltrados} onOpen={setAberto} />
          )}
          {entreguesFiltrados.length > 0 && (
            <StatusSection status="entregue" pedidos={entreguesFiltrados} onOpen={setAberto} />
          )}
        </>
      )}

      {aberto && (
        <OrderDrawer pedido={aberto} onClose={() => setAberto(null)} />
      )}
    </div>
  )
}
