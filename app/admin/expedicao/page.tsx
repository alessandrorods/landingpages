'use client'

import { useState, useEffect } from 'react'
import { useOrdersSummary } from '@/app/admin/components/useOrdersSummary'
import OrderDrawer from '@/app/admin/components/OrderDrawer'
import type { TinyPedidoCompleto, TinyPedidoResumo } from '@/lib/olist/types'
import { parseMotoboy } from '@/app/admin/lib/parseObs'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayFormatted(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
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

// ── OrderDrawerLoader ─────────────────────────────────────────────────────────

function OrderDrawerLoader({ id, onClose }: { id: number; onClose: () => void }) {
  const [pedido, setPedido] = useState<TinyPedidoCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.pedido) setPedido(data.pedido)
        else setErr(data.error ?? 'Pedido não encontrado')
      })
      .catch(() => setErr('Erro de conexão'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3 shadow-xl">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Carregando pedido…</p>
        </div>
      </div>
    )
  }

  if (err || !pedido) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3 shadow-xl max-w-xs text-center">
          <p className="text-sm text-red-600">{err || 'Pedido não encontrado'}</p>
          <button
            onClick={onClose}
            className="text-sm text-blue-600 font-semibold underline"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return <OrderDrawer pedido={pedido} onClose={onClose} />
}

// ── Card de resumo ────────────────────────────────────────────────────────────

function PedidoResumoCard({ r, onOpen }: { r: TinyPedidoResumo; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl font-bold font-mono text-gray-900 bg-blue-50 px-3 py-1 rounded-xl leading-none">
          #{r.numero}
        </span>
      </div>

      <p className="font-semibold text-gray-900 truncate">{r.nome}</p>

      {r.data_prevista && (
        <p className="text-xs text-gray-400 mt-1">Entrega: {r.data_prevista}</p>
      )}

      <div className="flex justify-end mt-2">
        <span className="text-xs text-blue-600 font-semibold">Ver detalhes ›</span>
      </div>
    </button>
  )
}

// ── Coluna ────────────────────────────────────────────────────────────────────

interface ColunaProps {
  titulo: string
  cor: string
  resumos: TinyPedidoResumo[]
  loading: boolean
  error: string
  lastUpdate: Date | null
  nextRefreshAt: number | null
  onRefresh: () => void
  onOpenPedido: (id: number) => void
}

function Coluna({ titulo, cor, resumos, loading, error, onOpenPedido }: ColunaProps) {
  return (
    <div className="flex flex-col min-w-0">
      <div className={`flex items-center gap-2 mb-3 px-1`}>
        <h2 className="text-sm font-bold text-gray-800">{titulo}</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cor}`}>
          {loading ? '…' : resumos.length}
        </span>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
      )}

      {!loading && !error && resumos.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum pedido</p>
      )}

      {!loading && resumos.map((r) => (
        <PedidoResumoCard key={r.id} r={r} onOpen={() => onOpenPedido(r.id)} />
      ))}
    </div>
  )
}

// ── Accordion (mobile) ────────────────────────────────────────────────────────

interface AccordionSectionProps extends ColunaProps {
  open: boolean
  onToggle: () => void
}

function AccordionSection({ titulo, cor, resumos, loading, error, onOpenPedido, open, onToggle }: AccordionSectionProps) {
  return (
    <div className="border border-gray-100 rounded-2xl bg-white shadow-sm mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-800">{titulo}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cor}`}>
            {loading ? '…' : resumos.length}
          </span>
        </div>
        <span className="text-gray-400 text-lg leading-none">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {loading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
              ))}
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
          )}

          {!loading && !error && resumos.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum pedido</p>
          )}

          {!loading && resumos.map((r) => (
            <PedidoResumoCard key={r.id} r={r} onOpen={() => onOpenPedido(r.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExpedicaoPage() {
  const today = todayFormatted()

  const prontoEnvio = useOrdersSummary('pronto_envio')
  const enviado = useOrdersSummary('enviado')
  const entregue = useOrdersSummary('entregue', today)

  const [drawerPedidoId, setDrawerPedidoId] = useState<number | null>(null)
  const [openSection, setOpenSection] = useState<string>('pronto_envio')

  function filtrar(resumos: typeof prontoEnvio.resumos) {
    return resumos.filter((r) => r.nome !== 'Consumidor Final')
  }

  const colunas = [
    {
      key: 'pronto_envio',
      titulo: 'Pronto para envio',
      cor: 'bg-blue-100 text-blue-700',
      ...prontoEnvio,
      resumos: filtrar(prontoEnvio.resumos),
    },
    {
      key: 'enviado',
      titulo: 'Enviado',
      cor: 'bg-orange-100 text-orange-700',
      ...enviado,
      resumos: filtrar(enviado.resumos),
    },
    {
      key: 'entregue',
      titulo: 'Entregue',
      cor: 'bg-green-100 text-green-800',
      ...entregue,
      resumos: filtrar(entregue.resumos),
    },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Expedição</h1>

      <BuscaPedido />

      {/* Desktop: 3 colunas */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
        {colunas.map((col) => (
          <Coluna
            key={col.key}
            titulo={col.titulo}
            cor={col.cor}
            resumos={col.resumos}
            loading={col.loading}
            error={col.error}
            lastUpdate={col.lastUpdate}
            nextRefreshAt={col.nextRefreshAt}
            onRefresh={col.refresh}
            onOpenPedido={setDrawerPedidoId}
          />
        ))}
      </div>

      {/* Mobile: accordion */}
      <div className="lg:hidden">
        {colunas.map((col) => (
          <AccordionSection
            key={col.key}
            titulo={col.titulo}
            cor={col.cor}
            resumos={col.resumos}
            loading={col.loading}
            error={col.error}
            lastUpdate={col.lastUpdate}
            nextRefreshAt={col.nextRefreshAt}
            onRefresh={col.refresh}
            onOpenPedido={setDrawerPedidoId}
            open={openSection === col.key}
            onToggle={() => setOpenSection(openSection === col.key ? '' : col.key)}
          />
        ))}
      </div>

      {drawerPedidoId !== null && (
        <OrderDrawerLoader id={drawerPedidoId} onClose={() => setDrawerPedidoId(null)} />
      )}
    </div>
  )
}
