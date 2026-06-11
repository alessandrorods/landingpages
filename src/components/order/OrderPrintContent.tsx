import { Fragment, useEffect, useRef } from 'react'
import type { OrderDTO } from '@/domains/orders/order.types'
import { resolveRegion } from '@/domains/orders/dispatch-queue'
import { useDeliveryPeriods } from '@/hooks/useDeliveryPeriods'
import { useDeliveryRegions } from '@/hooks/useDeliveryRegions'

interface Props {
  order: OrderDTO
  onReady?: () => void
}

export function OrderPrintContent({ order, onReady }: Props) {
  const hasGreeting = !!order.cardMessage
  const mesmaPessoa = order.recipientName === order.buyerName

  const { regions, loading: regionsLoading } = useDeliveryRegions()
  const { periods, loading: periodsLoading } = useDeliveryPeriods()
  const loading = regionsLoading || periodsLoading

  const containerRef = useRef<HTMLDivElement>(null)
  const readyCalled = useRef(false)
  useEffect(() => {
    if (readyCalled.current || loading) return
    readyCalled.current = true

    const images = Array.from(containerRef.current?.querySelectorAll('img') ?? [])
    Promise.all(images.map((img) => img.decode().catch(() => {}))).then(() => onReady?.())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const { regionLabel } = resolveRegion(order.zipCode, regions)
  const deliveryPeriodLabel = periods.find((p) => p.id === order.deliveryPeriod)?.label ?? order.deliveryPeriod

  return <div ref={containerRef}>
    <section className="flex flex-col justify-center h-[27cm]">
      {[1, 2].map((version) => <Fragment key={version}>
        <div className={`w-[17cm] h-[12cm] mx-auto mt-5 flex flex-col justify-between`}>
          <section className="relative">
            <section className="flex flex-row items-center">
              <div className="text-2xl basis-1/3">Pedido <strong>{String(order.id)}</strong></div>
              {!order.pickup && (
                <div className="basis-2/3 mx-2 border-2 border-black text-center font-bold text-lg uppercase py-1 truncate">
                  {regionLabel}
                </div>
              )}
              <div className="text-sm text-right basis-1/3">Via {version === 1 ? <>do entregador</> : <>da loja</>}</div>
            </section>

            <section className="text-left">
              <div className="text-lg mt-3">
                {order.pickup ? (
                  <div className="w-[13cm] border-2 border-black text-center font-bold text-lg uppercase py-1">
                    Retirada na loja
                  </div>
                ) : (
                  <>
                    <div>{order.street}, {order.streetNumber} {order.complement && <>({order.complement})</>}</div>
                    <div>{order.neighborhood} - Mogi das Cruzes</div>
                    <div>{order.zipCode}</div>
                  </>
                )}
                <div className="text-lg mt-2">
                  {order.pickup && <>
                  <section className="w-1/2">
                    <div>Cliente</div>
                    <div><strong>{order.buyerName}</strong></div>
                    <div>{order.buyerPhone}</div>
                  </section>
                  </>}

                  {!order.pickup && <>
                    Entregar para: <strong>{order.recipientName}</strong>{' '}
                    {!mesmaPessoa && order.recipientPhone}
                  </>}
                </div>
              </div>
            </section>

            {order.notes && (
              <section className="mt-2 text-[13px]">
                <div><strong>Observações:</strong> {order.notes}</div>
              </section>
            )}

            <div className="border-b-[1px] my-3" />

            <section className="absolute h-[3cm] w-[3cm] top-[35px] right-0 border-[1px] text-center">
              <span className="font-bold">VOLUMES</span>
            </section>

            <section className="relative pb-2 mb-2 border-b-[1px]">
              {order.deliveryPeriod && (
                <section className="text-left w-1/2 float-left">
                  <div className="flex items-baseline gap-3">
                    <div className="truncate">
                      <div>Período de entrega:</div>
                      <strong>{deliveryPeriodLabel}</strong>
                    </div>
                    <div className="text-xl font-bold whitespace-nowrap shrink-0">{order.deliveryDate}</div>
                  </div>
                </section>
              )}
              {version === 2 && !order.pickup && (
                <section className="text-right w-1/2 float-right">
                  <div>Comprador(a)</div>
                  <div><strong>{order.buyerName}</strong></div>
                  <div>{order.buyerPhone}</div>
                </section>
              )}
              <div className="clear-both" />
            </section>

            {order.items.length > 0 && (
              <section>
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

          <section className="mb-8 flex flex-row justify-end gap-6">
            {version === 2 && !order.pickup && <div className="border-t-[1px] basis-1/3">Entregador</div>}
            {version === 2 && !order.pickup && <div className="border-t-[1px] basis-1/3">Horário saída</div>}
            <div className="border-t-[1px] basis-1/3">Repasse (R$)</div>
          </section>
        </div>

        {version === 1 && <div className="border-b-[2px] border-dotted" />}
      </Fragment>)}
    </section>

    <div className="break-after-page" />

    {hasGreeting && (
      <section className="text-center flex flex-col items-center justify-center mx-auto w-[16cm] h-[27cm]">
        <div className="mb-7 flex flex-col justify-center items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mundoplanta.png" alt="Mundo Planta Flores e Presentes" className="w-[5cm] block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/arabesco.png" alt="divider" className="block w-[8cm] h-auto mt-3" />
        </div>

        <div className="min-h-[15cm] w-full text-center text-[14px] flex items-center justify-center">
          <div className="whitespace-pre-wrap">{order.cardMessage}</div>
        </div>

        <div className="mt-7 flex flex-col items-center">
          <div className="my-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arabesco.png" alt="divider" className="w-[8cm] h-auto" />
          </div>
          <div className="my-4">Pedido {String(order.id)}</div>
          <div className="text-center">
            <div>Encontre as melhores opções de presentes para qualquer ocasião</div>
            <div className="font-bold">www.floramundoplanta.com.br</div>
          </div>
        </div>
      </section>
    )}
  </div>
}
