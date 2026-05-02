'use client'

import type { TinyPedidoCompleto } from '@/lib/olist/types'

interface Props {
  pedido: TinyPedidoCompleto
  onClose: () => void
  action?: React.ReactNode
}

function fmt(phone: string) {
  return phone.replace(/\D/g, '')
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

export default function OrderDrawer({ pedido: p, onClose, action }: Props) {
  const endereco = p.enderecos?.[0]?.endereco ?? p.endereco_entrega
  const destinatario = endereco?.nome_destinatario
  const mesmaPessoa = !destinatario || destinatario === p.cliente?.nome
  const telefoneComprador = p.cliente?.fone ? fmt(p.cliente.fone) : ''
  const celularComprador = p.cliente?.celular ? fmt(p.cliente.celular) : ''

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative bg-white rounded-t-3xl max-h-[94vh] overflow-y-auto animate-modal-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* header */}
        <div className="px-5 pb-3 pt-1 flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold font-mono text-gray-900">#{p.numero}</span>
            {p.numero_ecommerce && (
              <p className="text-xs text-gray-400 mt-0.5">Ref: {p.numero_ecommerce}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl leading-none p-1"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="px-5 space-y-5 pb-10">
          {/* ── Pedido ── */}
          <Section label="Pedido">
            <div className="bg-gray-50 rounded-xl px-3 py-1">
              <Row label="Situação" value={p.situacao} />
              <Row label="Data do pedido" value={p.data_pedido} />
              <Row label="Entrega prevista" value={p.data_prevista} />
              <Row label="Período" value={p.forma_frete} />
            </div>
          </Section>

          <Divider />

          {/* ── Comprador ── */}
          <Section label="Comprador">
            <p className="font-semibold text-gray-900 mb-1">{p.cliente?.nome}</p>

            {(telefoneComprador || celularComprador) && (
              <div className="space-y-2">
                {telefoneComprador && (
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/55${telefoneComprador}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center text-sm font-semibold bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl transition-colors"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={`tel:${telefoneComprador}`}
                      className="flex-1 text-center text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl transition-colors"
                    >
                      {p.cliente?.fone}
                    </a>
                  </div>
                )}
                {celularComprador && celularComprador !== telefoneComprador && (
                  <a
                    href={`tel:${celularComprador}`}
                    className="block text-center text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl transition-colors"
                  >
                    Celular: {p.cliente?.celular}
                  </a>
                )}
              </div>
            )}

            {p.cliente?.email && (
              <p className="text-xs text-gray-400 mt-2">{p.cliente.email}</p>
            )}
          </Section>

          <Divider />

          {/* ── Destinatário ── */}
          <Section label="Destinatário">
            <p className="font-semibold text-gray-900 mb-0.5">
              {destinatario ?? p.cliente?.nome}
            </p>
            {mesmaPessoa && (
              <p className="text-xs text-gray-400 mb-1">Mesmo que o comprador</p>
            )}
            {endereco?.fone && (
              <a
                href={`tel:${fmt(endereco.fone)}`}
                className="inline-block text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-xl transition-colors"
              >
                {endereco.fone}
              </a>
            )}
          </Section>

          <Divider />

          {/* ── Endereço de entrega ── */}
          <Section label="Endereço de entrega">
            <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-0.5">
              <p className="text-sm font-medium text-gray-900">
                {endereco?.endereco}, {endereco?.numero}
                {endereco?.complemento ? ` — ${endereco.complemento}` : ''}
              </p>
              <p className="text-sm text-gray-600">{endereco?.bairro}</p>
              <p className="text-xs text-gray-400">
                CEP {endereco?.cep}
              </p>
              <p className="text-xs text-gray-400">
                {endereco?.cidade} / {endereco?.uf}
              </p>
            </div>
          </Section>

          <Divider />

          {/* ── Produtos ── */}
          {p.itens && p.itens.length > 0 && (
            <Section label="Produtos">
              <div className="space-y-2">
                {p.itens.map((i, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-sm font-semibold text-gray-900">{i.item.descricao}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {i.item.codigo ? `SKU ${i.item.codigo} · ` : ''}
                        {i.item.quantidade} {i.item.unidade ?? 'un'}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        R$ {i.item.valor_total ?? i.item.valor_unitario}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── Mensagem do cartão ── */}
          {p.obs_internas && (
            <>
              <Divider />
              <Section label="Mensagem do cartão">
                <p className="text-sm text-pink-900 italic bg-pink-50 rounded-xl px-3 py-2.5 leading-relaxed">
                  {p.obs_internas}
                </p>
              </Section>
            </>
          )}

          <Divider />

          {/* ── Financeiro ── */}
          <Section label="Financeiro">
            <div className="bg-gray-50 rounded-xl px-3 py-1">
              {p.valor_frete && <Row label="Frete" value={`R$ ${p.valor_frete}`} />}
              {p.valor_total && (
                <div className="flex justify-between gap-4 pt-2 mt-1 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-base font-bold text-gray-900">R$ {p.valor_total}</span>
                </div>
              )}
            </div>
          </Section>

          {/* ── Ação ── */}
          {action && (
            <>
              <Divider />
              <div>{action}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
