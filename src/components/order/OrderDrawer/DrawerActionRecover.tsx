'use client'

import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
}

export function DrawerActionRecover({ order }: Props) {
  const tel = order.buyerPhone.replace(/\D/g, '')
  if (!tel) return <p className="text-sm text-gray-400 text-center">Sem telefone cadastrado</p>

  const produto = order.items[0]?.name ?? 'produto'
  const firstName = order.buyerName.split(' ')[0]
  const msg = encodeURIComponent(
    `Olá ${firstName}! Identificamos um problema no pagamento do seu pedido de *${produto}* na Mundo Planta. Podemos te ajudar a concluir a compra?`
  )

  return (
    <div className="flex gap-2">
      <a
        href={`https://wa.me/55${tel}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center text-sm font-semibold bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-xl transition-colors"
      >
        WhatsApp
      </a>
      <a
        href={`tel:${tel}`}
        className="flex-1 text-center text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 rounded-xl transition-colors"
      >
        Ligar
      </a>
    </div>
  )
}
