'use client'

import { useEffect, useState, Fragment } from 'react'
import { useParams } from 'next/navigation'
import type { OlistOrderDetails, OlistAddress } from '@/clients/olist/types'
import { isOrderFromLI, parseLIData } from '@/domains/pedidos/parseObs'

interface Address {
  street: string
  number: string
  complement: string
  district: string
  city: string
  zip: string
}

export default function PrintPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OlistOrderDetails | null>(null)
  const [error, setError] = useState(false)
  const [address, setAddress] = useState<Address | null>(null)
  const [giftedName, setGiftedName] = useState<string | null>(null)
  const [greetingMessage, setGreetingMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.pedido) setOrder(data.pedido)
        else setError(true)
      })
      .catch(() => setError(true))
  }, [id])

  useEffect(() => {
    if (!order) return

    const fromLI = isOrderFromLI(order.obs_interna)
    const liData = fromLI ? parseLIData(order.obs_interna) : null

    const clienteEndereco: OlistAddress | undefined =
      fromLI && order.cliente.endereco
        ? {
            nome_destinatario: liData?.recipientName ?? '',
            endereco: order.cliente.endereco ?? '',
            numero: order.cliente.numero ?? '',
            complemento: order.cliente.complemento,
            bairro: order.cliente.bairro ?? '',
            cep: order.cliente.cep ?? '',
            cidade: order.cliente.cidade ?? '',
            uf: order.cliente.uf ?? '',
          }
        : undefined

    const shipping =
      order.enderecos?.[0]?.endereco ?? order.endereco_entrega ?? clienteEndereco

    setAddress({
      street: shipping?.endereco ?? '',
      number: shipping?.numero ?? '',
      complement: shipping?.complemento ?? '',
      district: shipping?.bairro ?? '',
      city: shipping?.cidade ?? '',
      zip: shipping?.cep ?? '',
    })

    setGiftedName(
      liData?.recipientName ?? order.endereco_entrega?.nome_destinatario ?? null,
    )

    if (!order.obs_interna && !order.obs_internas) {
      setGreetingMessage(null)
    } else if (fromLI) {
      const [, part] = (order.obs_interna ?? '').split('Mensagem no Cartão:')
      const [msg] = part?.split('------------------') ?? []
      setGreetingMessage(msg?.trim() ?? null)
    } else {
      setGreetingMessage(order.obs_interna || order.obs_internas || null)
    }

    const retrier = setInterval(() => {
      if (document.readyState === 'complete') {
        window.print()
      }
      clearInterval(retrier)
    }, 1000)

    return () => clearInterval(retrier)
  }, [order])

  if (error) {
    return <div className="text-red-700">Erro ao carregar o pedido</div>
  }

  if (!order) return null

  const hasGreeting = !!(order.obs_interna || order.obs_internas)

  return <>
    <section className="order-wrapper flex flex-col justify-center h-[27cm]">
      {[1, 2].map((version) => <Fragment key={version}>
        <div className={`version-${version} w-[17cm] h-[12cm] mx-auto mt-5 flex flex-col justify-between`}>
          <section className="order-details relative">
            <section className="header flex flex-row">
              <div className="text-2xl basis-2/3">Pedido <strong>{order.numero}</strong></div>
              <div className="text-sm text-right basis-1/3">Via {version === 1 ? <>do entregador</> : <>da loja</>}</div>
            </section>

            {address &&
              <section className="text-left">
                <div className="text-lg mt-3">
                  <div>{address.street}, {address.number} {address.complement && <>({address.complement})</>}</div>
                  <div>{address.district} - {address.city}</div>
                  <div>{address.zip}</div>

                  <div className="text-lg mt-2">Entregar para: <strong>{giftedName}</strong> {order.endereco_entrega?.fone && <>{order.endereco_entrega.fone}</>}</div>
                </div>
              </section>
            }

            {order.obs &&
              <section className="notes mt-2 text-[13px]">
                <div><strong>Observações:</strong> {order.obs}</div>
              </section>
            }

            <div className="border-b-[1px] my-3"></div>

            <section className="absolute h-[3cm] w-[3cm] top-[35px] right-0 border-[1px] text-center">
              <span className="font-bold">VOLUMES</span>
            </section>

            <section className="relative pb-2 mb-2 border-b-[1px]">
              {(order?.forma_frete || order?.nome_transportador) &&
                <section className="text-left truncate w-1/2 float-left">
                  <div>Período de entrega:</div>
                  <strong>{order.forma_frete || order?.nome_transportador}</strong>
                </section>
              }

              {(order.cliente && version === 2) &&
                <section className="text-right w-1/2 float-right">
                  <div>Comprador(a)</div>
                  <div><strong>{order.cliente.nome}</strong></div>
                  <div>{order.cliente.fone}</div>
                </section>
              }
              <div className="clear-both"></div>
            </section>

            {order.itens &&
              <section className="items">
                {order.itens.map((item, idx) => (
                  <div key={idx} className="flex flex-row text-[13px]">
                    <div className="basis-1/8 font-bold text-[14px]">{item.item.quantidade}x</div>
                    <div className="basis-1/8">{item.item.codigo}</div>
                    <div className="basis-6/8">{item.item.descricao}</div>
                  </div>
                ))}
              </section>
            }
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

    {hasGreeting &&
      <section className="greeting-card text-center flex flex-col items-center justify-center mx-auto w-[16cm] h-[27cm]">

        <div className="card-header mb-7 flex flex-col justify-center items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mundoplanta.png" alt="Mundo Planta Flores e Presentes" className="w-[5cm] block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/arabesco.png" alt="divider" className="block w-[8cm] h-auto mt-3" />
        </div>

        <div className="card-content min-h-[15cm] w-full text-center text-[14px] flex items-center justify-center">
          <div className="whitespace-pre-wrap">{greetingMessage}</div>
        </div>

        <div className="card-footer mt-7 flex flex-col items-center">
          <div className="my-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arabesco.png" alt="divider" className="w-[8cm] h-auto" />
          </div>

          {order && <div className="my-4">Pedido {order.numero}</div>}

          <div className="disclaimer">
            <div>Encontre as melhores opções de presentes para qualquer ocasião</div>
            <div className="font-bold">www.floramundoplanta.com.br</div>
          </div>
        </div>

      </section>
    }
  </>
}
