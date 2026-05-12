'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrdersSummary } from '@/app/admin/components/useOrdersSummary'
import OrderDrawer from '@/app/admin/components/OrderDrawer'
import type { TinyPedidoCompleto, TinyPedidoResumo } from '@/lib/olist/types'
import { DeliveryLabel } from '@/app/admin/components/DeliveryLabel'
import { parseMotoboy } from '@/app/admin/lib/parseObs'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayFormatted(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Em Aberto',
  aprovado: 'Pago',
  preparando_envio: 'Em montagem',
  faturado: 'Faturado',
  pronto_envio: 'Pronto para envio',
  enviado: 'Saiu para entrega',
  entregue: 'Entregue',
  nao_entregue: 'Não entregue',
  cancelado: 'Cancelado',
}

const STATUS_BADGE_CLS: Record<string, string> = {
  aberto: 'bg-gray-100 text-gray-600',
  aprovado: 'bg-green-100 text-green-700',
  preparando_envio: 'bg-yellow-100 text-yellow-700',
  faturado: 'bg-blue-100 text-blue-700',
  pronto_envio: 'bg-blue-100 text-blue-700',
  enviado: 'bg-orange-100 text-orange-700',
  entregue: 'bg-green-100 text-green-800',
}

function normSituacao(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '_')
}

function sortResumos(list: TinyPedidoResumo[]): TinyPedidoResumo[] {
  const toKey = (d?: string) => {
    if (!d) return ''
    const [dd, mm, yyyy] = d.split('/')
    return `${yyyy}${mm}${dd}`
  }
  return [...list].sort((a, b) => toKey(a.data_prevista).localeCompare(toKey(b.data_prevista)))
}

// ── Busca de pedido (conteúdo, controlado externamente) ───────────────────────

function BuscaPedidoPanel({ onClose: onClosePanel }: { onClose: () => void }) {
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
      if (!res.ok) { setErr(data.error ?? 'Erro ao buscar pedido'); return }
      setPedido(data.pedido)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const motoboy = pedido ? parseMotoboy(pedido.obs) : null
  const endereco = pedido?.enderecos?.[0]?.endereco ?? pedido?.endereco_entrega
  const situacaoKey = pedido ? normSituacao(pedido.situacao) : ''

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rastrear pedido</p>
        <button onClick={onClosePanel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
      </div>

      <form onSubmit={buscar} className="flex gap-2 mb-3">
        <input
          type="number"
          inputMode="numeric"
          value={numero}
          onChange={(e) => { setNumero(e.target.value); setErr(''); setPedido(null) }}
          placeholder="Nº do pedido"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          autoFocus
          required
        />
        <button
          type="submit"
          disabled={loading || !numero.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
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
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE_CLS[situacaoKey] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABEL[situacaoKey] ?? pedido.situacao}
              </span>
              <button onClick={() => { setPedido(null); setNumero('') }} className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1">×</button>
            </div>
          </div>
          {pedido.data_prevista && (
            <p className="text-xs text-gray-500">Entrega prevista: <span className="font-medium text-gray-700">{pedido.data_prevista}</span></p>
          )}
          {endereco && (
            <p className="text-sm text-gray-700">{endereco.bairro} — {endereco.endereco}, {endereco.numero}</p>
          )}
          {motoboy && (
            <p className="text-sm text-gray-700">Motoboy: <span className="font-semibold">{motoboy}</span></p>
          )}
          <button onClick={() => setDrawerAberto(true)} className="text-xs text-purple-600 font-semibold underline">
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

// ── Barra de topo (título + contagem + ações + lupa) ─────────────────────────

function PainelTopBar({
  totalCount,
  lojaFisicaCount,
  onlineCount,
  lastUpdate,
  nextRefreshAt,
  onRefresh,
  loading,
  searchOpen,
  onToggleSearch,
}: {
  totalCount: number
  lojaFisicaCount: number
  onlineCount: number
  lastUpdate: Date | null
  nextRefreshAt: number | null
  onRefresh: () => void
  loading: boolean
  searchOpen: boolean
  onToggleSearch: () => void
}) {
  const [secs, setSecs] = useState<number | null>(null)

  useEffect(() => {
    if (!nextRefreshAt || loading) { setSecs(null); return }
    function tick() { setSecs(Math.max(0, Math.ceil((nextRefreshAt! - Date.now()) / 1000))) }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [nextRefreshAt, loading])

  const time = lastUpdate
    ? lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <h1 className="text-xl font-bold text-gray-900 shrink-0">Painel da Operação</h1>

      <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full shrink-0">
        {totalCount} {totalCount === 1 ? 'pedido' : 'pedidos'}
      </span>
      {lojaFisicaCount > 0 && (
        <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full shrink-0">
          🏪 Loja Física: {lojaFisicaCount}
        </span>
      )}
      <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full shrink-0">
        🌐 Online: {onlineCount}
      </span>

      <div className="flex-1" />

      {secs !== null && (
        <span className="text-xs text-gray-400 tabular-nums shrink-0">{secs}s</span>
      )}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="text-sm text-purple-700 font-medium disabled:opacity-40 shrink-0"
      >
        {loading ? '...' : '↻ Atualizar'}
      </button>
      {time && (
        <span className="text-xs text-gray-400 shrink-0">· {time}</span>
      )}
      <button
        onClick={onToggleSearch}
        aria-label="Buscar pedido"
        className={`p-1.5 rounded-lg transition-colors shrink-0 ${searchOpen ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
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
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
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
          <button onClick={onClose} className="text-sm text-purple-600 font-semibold underline">Fechar</button>
        </div>
      </div>
    )
  }

  return (
    <OrderDrawer
      pedido={pedido}
      onClose={onClose}
      action={<AdminPainelActions pedido={pedido} onClose={onClose} />}
    />
  )
}

// ── Ações admin no drawer ─────────────────────────────────────────────────────

function AdminPainelActions({ pedido, onClose }: { pedido: TinyPedidoCompleto; onClose: () => void }) {
  const situacao = normSituacao(pedido.situacao ?? '')
  const existingMotoboy = parseMotoboy(pedido.obs) ?? ''
  const endereco = pedido.enderecos?.[0]?.endereco ?? pedido.endereco_entrega
  const nomeDefault = endereco?.nome_destinatario ?? pedido.cliente?.nome ?? ''

  const [motoboy, setMotoboy] = useState(existingMotoboy)
  const [recebidoPor, setRecebidoPor] = useState(nomeDefault)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState('')

  const closeAfterDelay = useCallback(() => setTimeout(onClose, 1500), [onClose])

  async function mudarStatus(novaSituacao: string) {
    setLoading(true); setErr(''); setDone('')
    try {
      const res = await fetch(`/api/admin/orders/${pedido.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: novaSituacao }),
      })
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Erro ao atualizar'); return }
      setDone(`Marcado como: ${STATUS_LABEL[novaSituacao] ?? novaSituacao}`)
      closeAfterDelay()
    } catch { setErr('Erro de conexão') } finally { setLoading(false) }
  }

  async function marcarEnviado() {
    if (!motoboy.trim()) return
    setLoading(true); setErr(''); setDone('')
    try {
      const res = await fetch(`/api/admin/orders/${pedido.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motoboy: motoboy.trim() }),
      })
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Erro ao despachar'); return }
      setDone('Marcado como: Saiu para entrega')
      closeAfterDelay()
    } catch { setErr('Erro de conexão') } finally { setLoading(false) }
  }

  async function marcarEntregue() {
    if (!recebidoPor.trim()) return
    setLoading(true); setErr(''); setDone('')
    try {
      const res = await fetch(`/api/admin/orders/${pedido.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recebidoPor: recebidoPor.trim(), motoboy: motoboy.trim() || 'Admin' }),
      })
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Erro ao confirmar entrega'); return }
      setDone('Entrega confirmada!')
      closeAfterDelay()
    } catch { setErr('Erro de conexão') } finally { setLoading(false) }
  }

  if (done) {
    return <p className="text-center text-green-700 font-semibold py-2 text-sm">✓ {done}</p>
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent'
  const btnPrimary = (color: string) =>
    `w-full ${color} disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors`
  const btnSecondary = 'w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm transition-colors'
  const btnDanger = 'w-full border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl text-sm transition-colors'

  return (
    <div className="space-y-2">
      {err && <p className="text-xs text-red-600 mb-1">{err}</p>}

      {/* Em aberto → pago */}
      {situacao === 'aberto' && (
        <button onClick={() => mudarStatus('aprovado')} disabled={loading}
          className={btnPrimary('bg-green-600 hover:bg-green-700')}>
          {loading ? 'Atualizando...' : '✓ Marcar como Pago'}
        </button>
      )}

      {/* Pago → em montagem */}
      {situacao === 'aprovado' && (
        <button onClick={() => mudarStatus('preparando_envio')} disabled={loading}
          className={btnPrimary('bg-yellow-500 hover:bg-yellow-600')}>
          {loading ? 'Atualizando...' : '🌸 Iniciar Montagem'}
        </button>
      )}

      {/* Pago ou Em montagem → pronto para envio */}
      {(situacao === 'aprovado' || situacao === 'preparando_envio' || situacao === 'faturado') && (
        <button onClick={() => mudarStatus('pronto_envio')} disabled={loading}
          className={btnSecondary}>
          {loading ? 'Atualizando...' : '📦 Marcar como Pronto para Envio'}
        </button>
      )}

      {/* Pronto para envio → enviado (com motoboy) */}
      {situacao === 'pronto_envio' && (
        <div className="space-y-2">
          <input
            type="text"
            value={motoboy}
            onChange={(e) => setMotoboy(e.target.value)}
            placeholder="Nome do motoboy"
            className={inputCls}
          />
          <button onClick={marcarEnviado} disabled={loading || !motoboy.trim()}
            className={btnPrimary('bg-orange-500 hover:bg-orange-600')}>
            {loading ? 'Despachando...' : '🏍 Marcar como Enviado'}
          </button>
        </div>
      )}

      {/* Enviado → entregue (com motoboy + recebidoPor) */}
      {situacao === 'enviado' && (
        <div className="space-y-2">
          <input
            type="text"
            value={motoboy}
            onChange={(e) => setMotoboy(e.target.value)}
            placeholder="Nome do motoboy"
            className={inputCls}
          />
          <input
            type="text"
            value={recebidoPor}
            onChange={(e) => setRecebidoPor(e.target.value)}
            placeholder="Recebido por"
            className={inputCls}
          />
          <button onClick={marcarEntregue} disabled={loading || !recebidoPor.trim()}
            className={btnPrimary('bg-green-600 hover:bg-green-700')}>
            {loading ? 'Confirmando...' : '✓ Confirmar Entrega'}
          </button>
        </div>
      )}

      {/* Cancelar (qualquer status não-final) */}
      {!['entregue', 'cancelado', 'nao_entregue'].includes(situacao) && (
        <button onClick={() => mudarStatus('cancelado')} disabled={loading}
          className={btnDanger}>
          Cancelar pedido
        </button>
      )}

      {/* Entregue — nenhuma ação */}
      {situacao === 'entregue' && (
        <p className="text-center text-sm text-gray-400 py-2">Pedido já entregue</p>
      )}
    </div>
  )
}

// ── Card de resumo ────────────────────────────────────────────────────────────

function PedidoResumoCard({
  r,
  onOpen,
  showStatus,
  dimmed,
}: {
  r: TinyPedidoResumo
  onOpen: () => void
  showStatus?: boolean
  dimmed?: boolean
}) {
  const situacaoKey = normSituacao(r.situacao ?? '')

  return (
    <button
      onClick={onOpen}
      className={`w-full text-left rounded-2xl border p-4 mb-3 active:scale-[0.99] transition-transform ${
        dimmed
          ? 'bg-gray-50 border-gray-100 opacity-50 shadow-none'
          : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={`text-xl font-bold font-mono px-3 py-1 rounded-xl leading-none ${dimmed ? 'text-gray-500 bg-gray-100' : 'text-gray-900 bg-purple-50'}`}>
          #{r.numero}
        </span>
        <DeliveryLabel data={r.data_prevista} />
        {showStatus && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE_CLS[situacaoKey] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[situacaoKey] ?? r.situacao}
          </span>
        )}
      </div>

      <p className={`font-semibold truncate ${dimmed ? 'text-gray-500' : 'text-gray-900'}`}>{r.nome}</p>

      <div className="flex justify-end mt-2">
        <span className={`text-xs font-semibold ${dimmed ? 'text-gray-400' : 'text-purple-600'}`}>Ver detalhes ›</span>
      </div>
    </button>
  )
}

// ── Coluna desktop ────────────────────────────────────────────────────────────

interface ColunaProps {
  titulo: string
  cor: string
  resumos: TinyPedidoResumo[]
  loading: boolean
  error: string
  onOpenPedido: (id: number) => void
  showStatus?: boolean
  dimCards?: boolean
  lojaFisicaCount?: number
}

function Coluna({ titulo, cor, resumos, loading, error, onOpenPedido, showStatus, dimCards, lojaFisicaCount }: ColunaProps) {
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-3 px-1 flex-wrap">
        <h2 className="text-sm font-bold text-gray-800 truncate">{titulo}</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cor}`}>
          {loading ? '…' : resumos.length}
        </span>
        {!loading && (lojaFisicaCount ?? 0) > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 bg-amber-100 text-amber-700">
            🏪 {lojaFisicaCount}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
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
        <PedidoResumoCard key={r.id} r={r} onOpen={() => onOpenPedido(r.id)} showStatus={showStatus} dimmed={dimCards} />
      ))}
    </div>
  )
}

// ── Accordion mobile ──────────────────────────────────────────────────────────

interface AccordionSectionProps extends ColunaProps {
  open: boolean
  onToggle: () => void
}

function AccordionSection({ titulo, cor, resumos, loading, error, onOpenPedido, showStatus, dimCards, lojaFisicaCount, open, onToggle }: AccordionSectionProps) {
  return (
    <div className="border border-gray-100 rounded-2xl bg-white shadow-sm mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-800">{titulo}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cor}`}>
            {loading ? '…' : resumos.length}
          </span>
          {!loading && (lojaFisicaCount ?? 0) > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              🏪 {lojaFisicaCount}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-lg leading-none ml-2">{open ? '▲' : '▼'}</span>
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
            <PedidoResumoCard key={r.id} r={r} onOpen={() => onOpenPedido(r.id)} showStatus={showStatus} dimmed={dimCards} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PainelPage() {
  const today = todayFormatted()

  const abertoHook = useOrdersSummary('aberto')
  const pagoHook = useOrdersSummary('aprovado')
  const montandoHook = useOrdersSummary('preparando_envio')
  const prontoHook = useOrdersSummary('pronto_envio')
  const enviadoHook = useOrdersSummary('enviado')
  const entregueHook = useOrdersSummary('entregue', today)

  const [drawerPedidoId, setDrawerPedidoId] = useState<number | null>(null)
  const [openSection, setOpenSection] = useState<string>('aberto')
  const [searchOpen, setSearchOpen] = useState(false)

  const CF = 'Consumidor Final'

  // Merge aprovado + preparando_envio
  const pagoMontandoAll = sortResumos([...pagoHook.resumos, ...montandoHook.resumos])
  const pagoMontandoLoading = pagoHook.loading || montandoHook.loading
  const pagoMontandoError = pagoHook.error || montandoHook.error

  // Online (non-CF) visible lists per paid column
  const pagoMontandoOnline = pagoMontandoAll.filter((r) => r.nome !== CF)
  const prontoOnline       = prontoHook.resumos.filter((r) => r.nome !== CF)
  const enviadoOnline      = enviadoHook.resumos.filter((r) => r.nome !== CF)
  const entregueOnline     = entregueHook.resumos.filter((r) => r.nome !== CF)

  // Loja Física counts per paid column
  const lfPagoMontando = pagoMontandoAll.length - pagoMontandoOnline.length
  const lfPronto       = prontoHook.resumos.length - prontoOnline.length
  const lfEnviado      = enviadoHook.resumos.length - enviadoOnline.length
  const lfEntregue     = entregueHook.resumos.length - entregueOnline.length

  const lojaFisicaCount = lfPagoMontando + lfPronto + lfEnviado + lfEntregue
  const onlineCount     = pagoMontandoOnline.length + prontoOnline.length + enviadoOnline.length + entregueOnline.length
  const totalCount      = lojaFisicaCount + onlineCount

  function refreshAll() {
    abertoHook.refresh()
    pagoHook.refresh()
    montandoHook.refresh()
    prontoHook.refresh()
    enviadoHook.refresh()
    entregueHook.refresh()
  }

  const allHooks = [abertoHook, pagoHook, montandoHook, prontoHook, enviadoHook, entregueHook]
  const anyLoading = allHooks.some((h) => h.loading)

  const lastUpdate = allHooks.reduce<Date | null>((best, h) => {
    if (!h.lastUpdate) return best
    return !best || h.lastUpdate > best ? h.lastUpdate : best
  }, null)

  const nextRefreshAt = allHooks.reduce<number | null>((soonest, h) => {
    if (!h.nextRefreshAt) return soonest
    return !soonest || h.nextRefreshAt < soonest ? h.nextRefreshAt : soonest
  }, null)

  const colunas = [
    {
      key: 'aberto',
      titulo: 'Em Aberto',
      cor: 'bg-gray-100 text-gray-600',
      resumos: abertoHook.resumos,
      loading: abertoHook.loading,
      error: abertoHook.error,
      showStatus: false,
      dimCards: true,
      lojaFisicaCount: 0,
    },
    {
      key: 'pago_montando',
      titulo: 'Pago / Em montagem',
      cor: 'bg-yellow-100 text-yellow-700',
      resumos: pagoMontandoOnline,
      loading: pagoMontandoLoading,
      error: pagoMontandoError,
      showStatus: true,
      dimCards: false,
      lojaFisicaCount: lfPagoMontando,
    },
    {
      key: 'pronto_envio',
      titulo: 'Pronto para Envio',
      cor: 'bg-blue-100 text-blue-700',
      resumos: prontoOnline,
      loading: prontoHook.loading,
      error: prontoHook.error,
      showStatus: false,
      dimCards: false,
      lojaFisicaCount: lfPronto,
    },
    {
      key: 'enviado',
      titulo: 'Enviado',
      cor: 'bg-orange-100 text-orange-700',
      resumos: enviadoOnline,
      loading: enviadoHook.loading,
      error: enviadoHook.error,
      showStatus: false,
      dimCards: false,
      lojaFisicaCount: lfEnviado,
    },
    {
      key: 'entregue',
      titulo: 'Entregue (hoje)',
      cor: 'bg-green-100 text-green-800',
      resumos: entregueOnline,
      loading: entregueHook.loading,
      error: entregueHook.error,
      showStatus: false,
      dimCards: false,
      lojaFisicaCount: lfEntregue,
    },
  ]

  return (
    <div>
      <PainelTopBar
        totalCount={totalCount}
        lojaFisicaCount={lojaFisicaCount}
        onlineCount={onlineCount}
        lastUpdate={lastUpdate}
        nextRefreshAt={nextRefreshAt}
        onRefresh={refreshAll}
        loading={anyLoading}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((v) => !v)}
      />

      {searchOpen && <BuscaPedidoPanel onClose={() => setSearchOpen(false)} />}

      {/* Desktop: 5 colunas, largura total */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-4">
        {colunas.map((col) => (
          <Coluna
            key={col.key}
            titulo={col.titulo}
            cor={col.cor}
            resumos={col.resumos}
            loading={col.loading}
            error={col.error}
            onOpenPedido={setDrawerPedidoId}
            showStatus={col.showStatus}
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
            onOpenPedido={setDrawerPedidoId}
            showStatus={col.showStatus}
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
