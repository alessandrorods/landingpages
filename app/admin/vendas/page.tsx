'use client'

import { useState } from 'react'
import { useOrders } from '@/app/admin/components/useOrders'
import StatusBar from '@/app/admin/components/StatusBar'
import EmptyState from '@/app/admin/components/EmptyState'
import type { TinyPedidoCompleto } from '@/lib/olist/types'

type Tab = 'pagos' | 'recuperar'

function fone(p: TinyPedidoCompleto): string {
  return (p.cliente?.fone ?? p.cliente?.celular ?? '').replace(/\D/g, '')
}

function whatsappMsg(p: TinyPedidoCompleto): string {
  const produto = p.itens?.[0]?.item?.descricao ?? 'produto'
  return encodeURIComponent(
    `Olá ${p.cliente?.nome?.split(' ')[0] ?? ''}! Identificamos um problema no pagamento do seu pedido de *${produto}* na Mundo Planta. Podemos te ajudar a concluir a compra?`,
  )
}

function PedidoPago({ p }: { p: TinyPedidoCompleto }) {
  const endereco = p.enderecos?.[0]?.endereco ?? p.endereco_entrega
  const produto = p.itens?.[0]?.item?.descricao ?? '—'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-semibold text-gray-900 leading-tight">{p.cliente?.nome}</p>
        <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full shrink-0">
          Pago
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-0.5">{produto}</p>
      {endereco && (
        <p className="text-xs text-gray-400">{endereco.bairro} · {p.data_prevista}</p>
      )}
      {p.obs_internas && (
        <p className="text-xs text-gray-500 italic mt-2 bg-gray-50 rounded-lg px-2 py-1.5">
          {p.obs_internas}
        </p>
      )}
    </div>
  )
}

function PedidoRecuperar({ p }: { p: TinyPedidoCompleto }) {
  const phone = fone(p)
  const produto = p.itens?.[0]?.item?.descricao ?? '—'

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 mb-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-semibold text-gray-900 leading-tight">{p.cliente?.nome}</p>
        <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full shrink-0">
          Pendente
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-0.5">{produto}</p>
      <p className="text-xs text-gray-400 mb-3">Pedido #{p.numero} · {p.data_prevista}</p>

      {phone ? (
        <div className="flex gap-2">
          <a
            href={`https://wa.me/55${phone}?text=${whatsappMsg(p)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <span>WhatsApp</span>
          </a>
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <span>Ligar</span>
          </a>
        </div>
      ) : (
        <p className="text-xs text-gray-400">Sem telefone cadastrado</p>
      )}
    </div>
  )
}

export default function VendasPage() {
  const [tab, setTab] = useState<Tab>('pagos')
  const pagos = useOrders('aprovado')
  const recuperar = useOrders('aberto')

  const active = tab === 'pagos' ? pagos : recuperar

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Pedidos</h1>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {([['pagos', 'Pagos', pagos.pedidos.length], ['recuperar', 'Recuperar', recuperar.pedidos.length]] as const).map(
          ([t, label, count]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {label}
              {!active.loading && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    tab === t
                      ? t === 'recuperar' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ),
        )}
      </div>

      <StatusBar
        count={active.pedidos.length}
        lastUpdate={active.lastUpdate}
        onRefresh={active.refresh}
        loading={active.loading}
      />

      {active.loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
          ))}
        </div>
      )}

      {!active.loading && active.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{active.error}</p>
      )}

      {!active.loading && !active.error && active.pedidos.length === 0 && (
        <EmptyState
          icon={tab === 'pagos' ? '✅' : '🎉'}
          message={tab === 'pagos' ? 'Nenhum pedido pago no momento' : 'Nenhum pedido para recuperar'}
        />
      )}

      {!active.loading &&
        tab === 'pagos' &&
        pagos.pedidos.map((p) => <PedidoPago key={p.id} p={p} />)}

      {!active.loading &&
        tab === 'recuperar' &&
        recuperar.pedidos.map((p) => <PedidoRecuperar key={p.id} p={p} />)}
    </div>
  )
}
