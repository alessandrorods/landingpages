'use client'

import { SiGooglemaps, SiWaze } from 'react-icons/si'
import { useUser } from '@/contexts/UserContext'
import { canSeeDrawerFeature } from '@/constants/orderDrawerFeatures'
import { Row } from '@/components/ui/Row'
import { Section } from '@/components/ui/Section'
import { Divider } from '@/components/ui/Divider'
import { CopyPhoneButton } from './CopyPhoneButton'
import { STATUS_BADGE } from '@/constants/orderDisplay'
import { useDeliveryPeriods } from '@/hooks/useDeliveryPeriods'
import { useDeliveryRegions } from '@/hooks/useDeliveryRegions'
import { resolveRegion } from '@/domains/orders/dispatch-queue'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
}

export function OrderSections({ order }: Props) {
  const role = useUser()?.role ?? null
  const canSee = (feature: Parameters<typeof canSeeDrawerFeature>[1]) =>
    canSeeDrawerFeature(role, feature)
  const { periods } = useDeliveryPeriods()
  const { regions } = useDeliveryRegions()
  const periodLabel = order.deliveryPeriod
    ? (periods.find((p) => p.id === order.deliveryPeriod)?.label ?? order.deliveryPeriod)
    : null
  const { regionLabel } = resolveRegion(order.zipCode, regions)

  const badge          = STATUS_BADGE[order.status]
  const compradorTel   = order.buyerPhone.replace(/\D/g, '')
  const destinatarioTel = order.recipientPhone.replace(/\D/g, '')
  const mesmaPessoa    = order.recipientName === order.buyerName

  return (
    <div className="space-y-5">
      {/* Status + data de entrega */}
      <Section label="Pedido">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${badge?.cls ?? 'bg-gray-100 text-gray-600'}`}>
              {badge?.label ?? order.status}
            </span>
            {!order.pickup && (
              <span className="text-sm font-semibold px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700">
                {regionLabel}
              </span>
            )}
          </div>
          {canSee('createdAt') && (
            <span className="text-xs text-gray-400 shrink-0">
              {new Date(order.createdAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl px-3 py-3 mb-4">
          <p className="text-xs text-gray-400 mb-0.5">Entrega prevista</p>
          <p className="text-xl font-bold text-gray-900">{order.deliveryDate}</p>
          {periodLabel && (
            <p className="text-xs text-gray-500 mt-0.5">{periodLabel}</p>
          )}
        </div>
      </Section>

      <Divider />

      {/* Comprador */}
      {canSee('buyerInfo') && (
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
        {mesmaPessoa && <p className="text-xs text-gray-400 mb-1">Mesmo que o comprador</p>}
        {destinatarioTel && (
          <div className="flex gap-2">
            <a
              href={`https://wa.me/55${destinatarioTel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-sm font-semibold bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl transition-colors"
            >
              WhatsApp
            </a>
            <CopyPhoneButton number={destinatarioTel} display={order.recipientPhone} />
          </div>
        )}
      </Section>

      <Divider />

      {/* Endereço / Retirada */}
      <div>
        {order.pickup ? (
          <div className="flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-3">
            <span className="text-purple-600 text-lg">🏪</span>
            <div>
              <p className="text-sm font-semibold text-purple-800">Retirada na loja</p>
              {order.deliveryDate && (
                <p className="text-xs text-purple-600 mt-0.5">Data: {order.deliveryDate}</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Endereço de entrega</p>
            <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-0.5 mb-3">
              <p className="text-sm font-medium text-gray-900">
                {order.street}, {order.streetNumber}
                {order.complement ? ` — ${order.complement}` : ''}
              </p>
              <p className="text-sm text-gray-600">{order.neighborhood}</p>
              <p className="text-xs text-gray-400">CEP {order.zipCode}</p>
              <p className="text-xs text-gray-400">Mogi das Cruzes / SP</p>
            </div>
          </>
        )}
        {!order.pickup && canSee('navigation') && (() => {
          const dest = encodeURIComponent(
            `${order.street}, ${order.streetNumber}, ${order.neighborhood}, Mogi das Cruzes, SP, ${order.zipCode}`
          )
          return (
            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${dest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-xl transition-colors"
              >
                <SiGooglemaps size={20} className="text-[#4285F4] shrink-0" />
                <span className="text-sm font-semibold text-blue-700">Maps</span>
              </a>
              <a
                href={`https://waze.com/ul?q=${dest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200 rounded-xl transition-colors"
              >
                <SiWaze size={20} className="text-[#05C8F7] shrink-0" />
                <span className="text-sm font-semibold text-cyan-700">Waze</span>
              </a>
            </div>
          )
        })()}
      </div>

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
                  {canSee('itemPrices') && (
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
      {canSee('cardMessage') && order.cardMessage && (
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
      {(canSee('freightAmount') || canSee('orderTotal')) && (
        <>
          <Divider />
          <Section label="Financeiro">
            <div className="bg-gray-50 rounded-xl px-3 py-1">
              {canSee('freightAmount') && (
                <Row label="Frete" value={`R$ ${order.freight.toFixed(2).replace('.', ',')}`} />
              )}
              {canSee('orderTotal') && (
                <div className="flex justify-between gap-4 pt-2 mt-1 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-base font-bold text-gray-900">
                    R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
