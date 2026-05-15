'use client'

import { useEffect, useState, Fragment } from 'react'
import { useParams } from 'next/navigation'
import type { OrderDTO } from '@/domains/orders/order.types'

export default function PrintPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.order) setOrder(data.order)
        else setError(true)
      })
      .catch(() => setError(true))
  }, [id])

  useEffect(() => {
    if (!order) return
    const retrier = setInterval(() => {
      if (document.readyState === 'complete') {
        window.print()
        clearInterval(retrier)
      }
    }, 1000)
    return () => clearInterval(retrier)
  }, [order])

  if (error) return <div className="text-red-700">Erro ao carregar o pedido</div>
  if (!order) return null

  const hasGreeting = !!order.cardMessage
  const mesmaPessoa = order.recipientName === order.buyerName

  return <>
    <section className="order-wrapper flex flex-col justify-center h-[27cm]">
      {[1, 2].map((version) => <Fragment key={version}>
        <div className={`version-${version} w-[17cm] h-[12cm] mx-auto mt-5 flex flex-col justify-between`}>
          <section className="order-details relative">
            <section className="header flex flex-row">
              <div className="text-2xl basis-2/3">Pedido <strong>{order.olistNumero ?? '—'}</strong></div>
              <div className="text-sm text-right basis-1/3">Via {version === 1 ? <>do entregador</> : <>da loja</>}</div>
            </section>

            <section className="text-left">
              <div className="text-lg mt-3">
                <div>{order.street}, {order.streetNumber} {order.complement && <>({order.complement})</>}</div>
                <div>{order.neighborhood} - Mogi das Cruzes</div>
                <div>{order.zipCode}</div>
                <div className="text-lg mt-2">
                  Entregar para: <strong>{order.recipientName}</strong>{' '}
                  {!mesmaPessoa && order.recipientPhone}
                </div>
              </div>
            </section>

            {order.notes && (
              <section className="notes mt-2 text-[13px]">
                <div><strong>Observações:</strong> {order.notes}</div>
              </section>
            )}

            <div className="border-b-[1px] my-3"></div>

            <section className="absolute h-[3cm] w-[3cm] top-[35px] right-0 border-[1px] text-center">
              <span className="font-bold">VOLUMES</span>
            </section>

            <section className="relative pb-2 mb-2 border-b-[1px]">
              {order.deliveryPeriod && (
                <section className="text-left truncate w-1/2 float-left">
                  <div>Período de entrega:</div>
                  <strong>{order.deliveryPeriod}</strong>
                </section>
              )}

              {version === 2 && (
                <section className="text-right w-1/2 float-right">
                  <div>Comprador(a)</div>
                  <div><strong>{order.buyerName}</strong></div>
                  <div>{order.buyerPhone}</div>
                </section>
              )}
              <div className="clear-both"></div>
            </section>

            {order.items.length > 0 && (
              <section className="items">
                {order.items.map((item) => (
                  <div key={item.id} className="flex flex-row text-[13px]">
                    <div className="basis-1/8 font-bold text-[14px]">{item.quantity}x</div>
                    <div className="basis-1/8">{item.sku ?? ''}</div>
                    <div className="basis-6/8">{item.name}</div>
                  </div>
                ))}
              </section>
            )}
          </section>

          <section className="totals mb-8 flex flex-row justify-end gap-6">
            {version === 2 && <><div className="border-t-[1px] basis-1/3">Entregador</div></>}
            {version === 2 && <><div className="border-t-[1px] basis-1/3">Horário saída</div></>}
            <div className="border-t-[1px] basis-1/3">Repasse (R$)</div>
          </section>
        </div>

        {version === 1 && <><div className="cut-line border-b-[2px] border-dotted"></div></>}
      </Fragment>)}
    </section>

    <div className="page-break break-after-page"></div>

    {hasGreeting && (
      <section className="greeting-card text-center flex flex-col items-center justify-center mx-auto w-[16cm] h-[27cm]">
        <div className="card-header mb-7 flex flex-col justify-center items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mundoplanta.png" alt="Mundo Planta Flores e Presentes" className="w-[5cm] block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/arabesco.png" alt="divider" className="block w-[8cm] h-auto mt-3" />
        </div>

        <div className="card-content min-h-[15cm] w-full text-center text-[14px] flex items-center justify-center">
          <div className="whitespace-pre-wrap">{order.cardMessage}</div>
        </div>

        <div className="card-footer mt-7 flex flex-col items-center">
          <div className="my-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arabesco.png" alt="divider" className="w-[8cm] h-auto" />
          </div>
          <div className="my-4">Pedido {order.olistNumero ?? '—'}</div>
          <div className="disclaimer">
            <div>Encontre as melhores opções de presentes para qualquer ocasião</div>
            <div className="font-bold">www.floramundoplanta.com.br</div>
          </div>
        </div>
      </section>
    )}
  </>
}
