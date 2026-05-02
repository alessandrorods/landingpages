'use client'

import type { TinyPedidoCompleto } from '@/lib/olist/types'

interface Props {
  pedido: TinyPedidoCompleto
  onClose: () => void
  action?: React.ReactNode
}

export default function OrderDrawer({ pedido: p, onClose, action }: Props) {
  const endereco = p.enderecos?.[0]?.endereco ?? p.endereco_entrega
  const destinatario = endereco?.nome_destinatario
  const mesmaPessoa = !destinatario || destinatario === p.cliente?.nome

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto animate-modal-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-2 pt-1 flex items-center justify-between">
          <span className="text-3xl font-bold font-mono text-gray-900">#{p.numero}</span>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl leading-none p-1"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="px-5 space-y-4 pb-8">
          {/* status + data */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {p.situacao}
            </span>
            {p.data_prevista && (
              <span className="text-xs text-gray-500">Entrega: {p.data_prevista}</span>
            )}
            {p.forma_frete && (
              <span className="text-xs text-gray-400">· {p.forma_frete}</span>
            )}
          </div>

          {/* comprador */}
          <Section label="Comprador">
            <p className="font-medium text-gray-900">{p.cliente?.nome}</p>
            {p.cliente?.fone && (
              <div className="flex gap-2 mt-2">
                <a
                  href={`https://wa.me/55${p.cliente.fone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-sm font-semibold bg-green-500 text-white py-2 rounded-xl"
                >
                  WhatsApp
                </a>
                <a
                  href={`tel:${p.cliente.fone.replace(/\D/g, '')}`}
                  className="flex-1 text-center text-sm font-semibold bg-gray-100 text-gray-800 py-2 rounded-xl"
                >
                  Ligar
                </a>
              </div>
            )}
          </Section>

          {/* destinatário */}
          {!mesmaPessoa && (
            <Section label="Destinatário">
              <p className="font-medium text-gray-900">{destinatario}</p>
              {endereco?.fone && (
                <a
                  href={`tel:${endereco.fone.replace(/\D/g, '')}`}
                  className="text-sm text-blue-600 font-medium"
                >
                  {endereco.fone}
                </a>
              )}
            </Section>
          )}

          {/* produto */}
          {p.itens && p.itens.length > 0 && (
            <Section label="Produto">
              {p.itens.map((i, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-900 font-medium">{i.item.descricao}</span>
                  <span className="text-gray-500 shrink-0 ml-2">
                    {i.item.quantidade}x · R$ {i.item.valor_unitario}
                  </span>
                </div>
              ))}
            </Section>
          )}

          {/* mensagem */}
          {p.obs_internas && (
            <Section label="Mensagem do cartão">
              <p className="text-sm text-pink-900 italic bg-pink-50 rounded-xl px-3 py-2.5">
                {p.obs_internas}
              </p>
            </Section>
          )}

          {/* endereço */}
          {endereco && (
            <Section label="Endereço de entrega">
              <p className="text-sm text-gray-900 font-medium">
                {endereco.endereco}, {endereco.numero}
                {endereco.complemento ? ` — ${endereco.complemento}` : ''}
              </p>
              <p className="text-sm text-gray-600">{endereco.bairro}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                CEP {endereco.cep} · {endereco.cidade}/{endereco.uf}
              </p>
            </Section>
          )}

          {/* valor */}
          {p.valor_total && (
            <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
              <span className="text-gray-500">Total do pedido</span>
              <span className="font-semibold text-gray-900">R$ {p.valor_total}</span>
            </div>
          )}

          {action && <div className="pt-2">{action}</div>}
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
      {children}
    </div>
  )
}
