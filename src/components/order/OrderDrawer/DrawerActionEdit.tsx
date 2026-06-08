'use client'

import { useState, useRef, useCallback } from 'react'
import { useDeliveryPeriods } from '@/hooks/useDeliveryPeriods'
import { maskPhone, lookupCep } from '@/lib/phone'
import type { OrderDTO, OrderItemDTO, OrderStatus } from '@/domains/orders/order.types'

// ── Warning banner ────────────────────────────────────────────────────────────

interface WarningConfig {
  message: string
  cls: string
}

function getWarning(status: OrderStatus): WarningConfig | null {
  if (['preparing', 'ready', 'available_for_pickup'].includes(status)) {
    return {
      message: 'A comanda deste pedido pode já ter sido impressa. Comunique a equipe de montagem sobre qualquer alteração.',
      cls: 'bg-amber-50 border-amber-300 text-amber-800',
    }
  }
  if (status === 'dispatched') {
    return {
      message: 'Este pedido está em rota. Comunique o motoboy sobre alterações no endereço.',
      cls: 'bg-orange-50 border-orange-300 text-orange-800',
    }
  }
  if (['delivered', 'undelivered'].includes(status)) {
    return {
      message: 'Este pedido já foi finalizado. Alterações são apenas para correção de registro.',
      cls: 'bg-gray-100 border-gray-300 text-gray-600',
    }
  }
  if (status === 'cancelled') {
    return {
      message: 'Este pedido está cancelado. Alterações são apenas para correção de registro.',
      cls: 'bg-gray-100 border-gray-300 text-gray-600',
    }
  }
  return null
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 ${props.className ?? ''}`}
    />
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{children}</p>
}

// ── Item list ─────────────────────────────────────────────────────────────────

interface EditItem {
  sku: string | null
  name: string
  price: number
  quantity: number
}

function ItemList({ items, onUpdatePrice, onUpdateQty, onRemove }: {
  items: EditItem[]
  onUpdatePrice: (i: number, v: string) => void
  onUpdateQty: (i: number, v: string) => void
  onRemove: (i: number) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {item.sku && <p className="text-xs font-mono text-gray-400">{item.sku}</p>}
              <p className="text-sm font-medium text-gray-900 leading-snug">{item.name}</p>
            </div>
            <button type="button" onClick={() => onRemove(idx)} className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0 transition-colors">×</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Qtd</Label>
              <Input type="number" inputMode="numeric" min="1" value={item.quantity} onChange={(e) => onUpdateQty(idx, e.target.value)} className="py-2" />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input type="number" inputMode="decimal" step="0.01" min="0" value={item.price} onChange={(e) => onUpdatePrice(idx, e.target.value)} className="py-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Product search ────────────────────────────────────────────────────────────

interface FoundProduct { id: number; sku: string; nome: string; preco: number }

function ProductSearch({ onSelect }: { onSelect: (p: FoundProduct) => void }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<FoundProduct[]>([])
  const [searched, setSearched] = useState(false)
  const [err, setErr] = useState('')

  async function search() {
    const term = q.trim()
    if (!term) return
    setLoading(true); setErr(''); setResults([]); setSearched(false)
    try {
      const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(term)}`)
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Erro ao buscar'); return }
      const produtos = data.produtos ?? []
      setResults(produtos); setSearched(true)
      if (produtos.length === 1) { onSelect(produtos[0]); setQ(''); setResults([]); setSearched(false) }
    } catch { setErr('Erro de conexão') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => { setQ(e.target.value); setResults([]); setSearched(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search() } }}
          placeholder="SKU ou nome do produto" />
        <button type="button" onClick={search} disabled={loading || !q.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap">
          {loading ? '...' : 'Buscar'}
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {searched && results.length === 0 && <p className="text-xs text-gray-500">Nenhum produto encontrado</p>}
      {results.length > 1 && (
        <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-40">
          {results.map((p) => (
            <button key={p.id} type="button"
              onClick={() => { onSelect(p); setQ(''); setResults([]); setSearched(false) }}
              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors text-sm">
              {p.sku && <span className="font-mono text-xs text-gray-400 mr-2">{p.sku}</span>}
              <span className="font-medium text-gray-900">{p.nome}</span>
              <span className="float-right text-gray-500">R$ {p.preco.toFixed(2).replace('.', ',')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toInputDate(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split('/')
  return `${yyyy}-${mm}-${dd}`
}

function fromInputDate(yyyymmdd: string): string {
  const [yyyy, mm, dd] = yyyymmdd.split('-')
  return `${dd}/${mm}/${yyyy}`
}

function itemsFromDTO(items: OrderItemDTO[]): EditItem[] {
  return items.map((i) => ({ sku: i.sku, name: i.name, price: i.price, quantity: i.quantity }))
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  order: OrderDTO
  onSuccess: () => void
}

export function DrawerActionEdit({ order, onSuccess }: Props) {
  const { periods } = useDeliveryPeriods()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // Comprador
  const [buyerName, setBuyerName]   = useState(order.buyerName)
  const [buyerPhone, setBuyerPhone] = useState(order.buyerPhone)

  // Destinatário
  const [recipientName,  setRecipientName]  = useState(order.recipientName)
  const [recipientPhone, setRecipientPhone] = useState(order.recipientPhone)
  const [cardMessage,    setCardMessage]    = useState(order.cardMessage ?? '')

  // Endereço
  const [zipCode,      setZipCode]      = useState(order.zipCode ?? '')
  const [street,       setStreet]       = useState(order.street ?? '')
  const [streetNumber, setStreetNumber] = useState(order.streetNumber ?? '')
  const [complement,   setComplement]   = useState(order.complement ?? '')
  const [neighborhood, setNeighborhood] = useState(order.neighborhood ?? '')
  const [cepLoading,   setCepLoading]   = useState(false)

  // Entrega
  const [deliveryDate,   setDeliveryDate]   = useState(toInputDate(order.deliveryDate))
  const [deliveryPeriod, setDeliveryPeriod] = useState(order.deliveryPeriod ?? '')
  const [freight,        setFreight]        = useState(String(order.freight))

  // Observações
  const [notes, setNotes] = useState(order.notes ?? '')

  // Produtos
  const [items, setItems] = useState<EditItem[]>(() => itemsFromDTO(order.items))

  const warning = getWarning(order.status)

  async function handleCepChange(raw: string) {
    setZipCode(raw)
    const c = raw.replace(/\D/g, '')
    if (c.length !== 8) return
    setCepLoading(true)
    const result = await lookupCep(c)
    if (result) { setStreet(result.logradouro); setNeighborhood(result.bairro) }
    setCepLoading(false)
  }

  function addProduct(p: FoundProduct) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.sku && i.sku === p.sku)
      if (idx >= 0) return prev.map((i, n) => n === idx ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { sku: p.sku, name: p.nome, price: p.preco, quantity: 1 }]
    })
  }

  function updatePrice(idx: number, v: string) {
    const price = parseFloat(v)
    if (!isNaN(price)) setItems((prev) => prev.map((i, n) => n === idx ? { ...i, price } : i))
  }

  function updateQty(idx: number, v: string) {
    const quantity = parseInt(v)
    if (!isNaN(quantity) && quantity >= 1) setItems((prev) => prev.map((i, n) => n === idx ? { ...i, quantity } : i))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) { setErr('Adicione ao menos um produto'); return }
    setLoading(true); setErr('')
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName:     buyerName.trim(),
          buyerPhone:    buyerPhone.replace(/\D/g, ''),
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.replace(/\D/g, ''),
          cardMessage:   cardMessage.trim() || undefined,
          zipCode:       order.pickup ? undefined : zipCode.replace(/\D/g, '') || undefined,
          street:        order.pickup ? undefined : street.trim() || undefined,
          streetNumber:  order.pickup ? undefined : streetNumber.trim() || undefined,
          complement:    order.pickup ? undefined : complement.trim() || undefined,
          neighborhood:  order.pickup ? undefined : neighborhood.trim() || undefined,
          deliveryDate:  fromInputDate(deliveryDate),
          deliveryPeriod: deliveryPeriod || undefined,
          freight:       order.pickup ? 0 : (parseFloat(freight) || 0),
          notes:         notes.trim() || undefined,
          items:         items.map((i) => ({ sku: i.sku ?? undefined, name: i.name, price: i.price, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Erro ao salvar'); return }
      onSuccess()
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

  return (
    <form onSubmit={submit} className="space-y-5">

      {/* Warning banner */}
      {warning && (
        <div className={`flex gap-2.5 items-start border rounded-xl px-3.5 py-3 text-sm ${warning.cls}`}>
          <span className="shrink-0 mt-0.5">⚠️</span>
          <p>{warning.message}</p>
        </div>
      )}

      {/* Comprador */}
      <div className="space-y-2">
        <SectionTitle>Comprador</SectionTitle>
        <div>
          <Label required>Nome</Label>
          <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input type="tel" inputMode="numeric" value={buyerPhone}
            onChange={(e) => setBuyerPhone(maskPhone(e.target.value))} />
        </div>
      </div>

      {/* Destinatário */}
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <SectionTitle>Destinatário</SectionTitle>
        <div>
          <Label required>Nome</Label>
          <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input type="tel" inputMode="numeric" value={recipientPhone}
            onChange={(e) => setRecipientPhone(maskPhone(e.target.value))} />
        </div>
        <div>
          <Label>Mensagem do cartão</Label>
          <textarea value={cardMessage} onChange={(e) => setCardMessage(e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none" />
        </div>
      </div>

      {/* Endereço (apenas delivery) */}
      {!order.pickup && (
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <SectionTitle>Endereço de entrega</SectionTitle>
          <div>
            <Label>CEP{cepLoading ? ' (buscando...)' : ''}</Label>
            <Input type="text" inputMode="numeric" value={zipCode}
              onChange={(e) => handleCepChange(e.target.value)} maxLength={9} placeholder="00000-000" />
          </div>
          <div>
            <Label required>Logradouro</Label>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label required>Número</Label>
              <Input value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} required />
            </div>
            <div>
              <Label>Complemento</Label>
              <Input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, bloco..." />
            </div>
          </div>
          <div>
            <Label required>Bairro</Label>
            <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required />
          </div>
        </div>
      )}

      {/* Entrega */}
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <SectionTitle>Entrega</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label required>Data</Label>
            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
              min={today} required />
          </div>
          {periods.length > 0 && (
            <div>
              <Label>Período</Label>
              <select value={deliveryPeriod} onChange={(e) => setDeliveryPeriod(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white">
                <option value="">—</option>
                {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          )}
        </div>
        {!order.pickup && (
          <div>
            <Label required>Frete (R$)</Label>
            <Input type="number" inputMode="decimal" step="0.01" min="0" value={freight}
              onChange={(e) => setFreight(e.target.value)} required />
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="pt-4 border-t border-gray-100">
        <SectionTitle>Observações</SectionTitle>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          placeholder="Instruções especiais, referências..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none" />
      </div>

      {/* Produtos */}
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <SectionTitle>Produtos</SectionTitle>
        <ItemList items={items} onUpdatePrice={updatePrice} onUpdateQty={updateQty} onRemove={(i) => setItems((prev) => prev.filter((_, n) => n !== i))} />
        {items.length > 0 && <div className="border-t border-gray-100" />}
        <ProductSearch onSelect={addProduct} />
      </div>

      {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5">{err}</p>}

      <button type="submit" disabled={loading || items.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
        {loading ? 'Salvando...' : 'Salvar alterações'}
      </button>

    </form>
  )
}
