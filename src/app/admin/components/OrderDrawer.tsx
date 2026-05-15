'use client'

import { useState, useCallback } from 'react'
import type { OrderDTO } from '@/domains/orders/order.types'
import { IoPrintOutline, IoRefreshOutline, IoCopyOutline, IoCheckmarkOutline } from 'react-icons/io5'

interface Props {
  order: OrderDTO
  onClose: () => void
  action?: React.ReactNode
  hideBuyer?: boolean
  hidePrices?: boolean
  hideCardMessage?: boolean
  showConfirmationCopy?: boolean
  onRefresh?: (updated: OrderDTO) => void
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-100" />
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Aguardando pagamento', cls: 'bg-gray-100 text-gray-600' },
  approved:    { label: 'Pago',                 cls: 'bg-green-100 text-green-700' },
  preparing:   { label: 'Preparando',           cls: 'bg-blue-100 text-blue-700' },
  invoiced:    { label: 'Faturado',             cls: 'bg-blue-100 text-blue-700' },
  ready:       { label: 'Pronto para envio',    cls: 'bg-blue-100 text-blue-700' },
  dispatched:  { label: 'Saiu para entrega',    cls: 'bg-orange-100 text-orange-700' },
  delivered:   { label: 'Entregue',             cls: 'bg-green-100 text-green-800' },
  undelivered: { label: 'Não entregue',         cls: 'bg-red-100 text-red-700' },
  cancelled:   { label: 'Cancelado',            cls: 'bg-red-100 text-red-700' },
}

function CopyPhoneButton({ number, display }: { number: string; display: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(number).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={copy}
      className="flex-1 text-center text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl transition-colors"
    >
      {copied ? '✓ Copiado!' : display}
    </button>
  )
}

export default function OrderDrawer({ order: initialOrder, onClose, action, hideBuyer, hidePrices, hideCardMessage, showConfirmationCopy, onRefresh }: Props) {
  const [order, setOrder] = useState(initialOrder)
  const [syncing, setSyncing] = useState(false)
  const [copiedConfirmation, setCopiedConfirmation] = useState(false)

  function copyConfirmation() {
    const msg = `Obrigado por sua compra!\n\n➡️ O número do seu pedido é *${order.olistNumero ?? order.id}*\n\nAcompanhe seu pedido pelo link abaixo:\nhttps://florapp.com.br/tracking/${order.id}`
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedConfirmation(true)
      setTimeout(() => setCopiedConfirmation(false), 2000)
    })
  }

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.order) {
          setOrder(data.order)
          onRefresh?.(data.order)
        }
      }
    } finally {
      setSyncing(false)
    }
  }, [order.id, onRefresh])

  const badge = STATUS_BADGE[order.status]
  const compradorTel = order.buyerPhone.replace(/\D/g, '')
  const mesmaPessoa = order.recipientName === order.buyerName
  const destinatarioTel = order.recipientPhone.replace(/\D/g, '')
  const valorTotal = order.totalAmount.toFixed(2).replace('.', ',')
  const freteDisplay = order.freight.toFixed(2).replace('.', ',')

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg flex flex-col max-h-[94vh] md:max-h-[85vh] animate-modal-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fixo */}
        <div className="flex-none">
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="px-5 pb-3 pt-3 flex items-center justify-between border-b border-gray-100">
            <div>
              <span className="text-3xl font-bold font-mono text-gray-900">
                #{order.olistNumero ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={sync}
                disabled={syncing}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40"
                aria-label="Recarregar pedido"
              >
                <IoRefreshOutline size={20} className={syncing ? 'animate-spin' : ''} />
              </button>
              {showConfirmationCopy && (
                <button
                  onClick={copyConfirmation}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Copiar mensagem de confirmação"
                >
                  {copiedConfirmation ? <IoCheckmarkOutline size={20} className="text-green-500" /> : <IoCopyOutline size={20} />}
                </button>
              )}
              <a
                href={`/print/${order.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Imprimir pedido"
              >
                <IoPrintOutline size={20} />
              </a>
              <button
                onClick={onClose}
                className="text-gray-400 text-2xl leading-none p-1"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Pedido */}
          <Section label="Pedido">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${badge?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                {badge?.label ?? order.status}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl px-3 py-3 mb-4">
              <p className="text-xs text-gray-400 mb-0.5">Entrega prevista</p>
              <p className="text-xl font-bold text-gray-900">{order.deliveryDate}</p>
              {order.deliveryPeriod && (
                <p className="text-xs text-gray-500 mt-0.5">{order.deliveryPeriod}</p>
              )}
            </div>

            {(order.courierName || order.dispatchedAt || order.deliveredAt || order.receivedBy) && (
              <>
                <Divider />
                <div className="bg-gray-50 rounded-xl px-3 py-1 mt-4">
                  <Row label="Motoboy" value={order.courierName} />
                  <Row label="Saiu para entrega em" value={order.dispatchedAt} />
                  <Row label="Entregue em" value={order.deliveredAt} />
                  <Row label="Recebido por" value={order.receivedBy} />
                </div>
              </>
            )}
          </Section>

          <Divider />

          {/* Comprador */}
          {!hideBuyer && (
            <>
              <Section label="Comprador">
                <p className="font-semibold text-gray-900 mb-1">{order.buyerName}</p>
                {compradorTel && (
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/55${compradorTel}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center text-sm font-semibold bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl transition-colors"
                    >
                      WhatsApp
                    </a>
                    <CopyPhoneButton number={compradorTel} display={order.buyerPhone} />
                  </div>
                )}
              </Section>
              <Divider />
            </>
          )}

          {/* Destinatário */}
          <Section label="Destinatário">
            <p className="font-semibold text-gray-900 mb-0.5">{order.recipientName}</p>
            {mesmaPessoa && (
              <p className="text-xs text-gray-400 mb-1">Mesmo que o comprador</p>
            )}
            {destinatarioTel && !mesmaPessoa && (
              <CopyPhoneButton number={destinatarioTel} display={order.recipientPhone} />
            )}
          </Section>

          <Divider />

          {/* Endereço */}
          <Section label="Endereço de entrega">
            <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-0.5">
              <p className="text-sm font-medium text-gray-900">
                {order.street}, {order.streetNumber}
                {order.complement ? ` — ${order.complement}` : ''}
              </p>
              <p className="text-sm text-gray-600">{order.neighborhood}</p>
              <p className="text-xs text-gray-400">CEP {order.zipCode}</p>
              <p className="text-xs text-gray-400">Mogi das Cruzes / SP</p>
            </div>
          </Section>

          {/* Observações */}
          {order.notes && (
            <>
              <Divider />
              <Section label="Observações">
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed whitespace-pre-line">
                  {order.notes}
                </p>
              </Section>
            </>
          )}

          <Divider />

          {/* Produtos */}
          {order.items.length > 0 && (
            <Section label="Produtos">
              <div className="space-y-2">
                {order.items.map((i) => (
                  <div key={i.id} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-sm font-semibold text-gray-900">{i.name}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {i.sku ? `SKU ${i.sku} · ` : ''}{i.quantity} un
                      </span>
                      {!hidePrices && (
                        <span className="text-sm font-medium text-gray-700">
                          R$ {(i.price * i.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Mensagem do cartão */}
          {!hideCardMessage && order.cardMessage && (
            <>
              <Divider />
              <Section label="Mensagem do cartão">
                <p className="text-sm text-pink-900 italic bg-pink-50 rounded-xl px-3 py-2.5 leading-relaxed">
                  {order.cardMessage}
                </p>
              </Section>
            </>
          )}

          {/* Financeiro */}
          {!hidePrices && (
            <>
              <Divider />
              <Section label="Financeiro">
                <div className="bg-gray-50 rounded-xl px-3 py-1">
                  <Row label="Frete" value={`R$ ${freteDisplay}`} />
                  <div className="flex justify-between gap-4 pt-2 mt-1 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Total</span>
                    <span className="text-base font-bold text-gray-900">R$ {valorTotal}</span>
                  </div>
                </div>
              </Section>
            </>
          )}
        </div>

        {/* Footer fixo */}
        {action && (
          <div className="flex-none border-t border-gray-100 px-5 py-4">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
