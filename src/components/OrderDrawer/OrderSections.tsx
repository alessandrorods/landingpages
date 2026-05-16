import { Row } from '@/components/ui/Row'
import { Section } from '@/components/ui/Section'
import { Divider } from '@/components/ui/Divider'
import { CopyPhoneButton } from './CopyPhoneButton'
import { STATUS_BADGE } from '@/constants/orderDisplay'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
  showBuyer: boolean
  showPrices: boolean
  showCardMessage: boolean
}

export function OrderSections({ order, showBuyer, showPrices, showCardMessage }: Props) {
  const badge         = STATUS_BADGE[order.status]
  const compradorTel  = order.buyerPhone.replace(/\D/g, '')
  const mesmaPessoa   = order.recipientName === order.buyerName
  const destinatarioTel = order.recipientPhone.replace(/\D/g, '')
  const valorTotal    = order.totalAmount.toFixed(2).replace('.', ',')
  const freteDisplay  = order.freight.toFixed(2).replace('.', ',')

  return (
    <div className="space-y-5">
      {/* Status + data de entrega */}
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
              <Row label="Motoboy"             value={order.courierName} />
              <Row label="Saiu para entrega em" value={order.dispatchedAt} />
              <Row label="Entregue em"          value={order.deliveredAt} />
              <Row label="Recebido por"         value={order.receivedBy} />
            </div>
          </>
        )}
      </Section>

      <Divider />

      {/* Comprador */}
      {showBuyer && (
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
                  {showPrices && (
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
      {showCardMessage && order.cardMessage && (
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
      {showPrices && (
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
  )
}
