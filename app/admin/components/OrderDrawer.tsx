'use client'

import { useState } from 'react'
import type { TinyPedidoCompleto } from '@/lib/olist/types'
import { parseMotoboy, parseRecebidoPor, parseEntregue, parseObsUsuario, isOrderFromLI, parseLIData } from '@/app/admin/lib/parseObs'
import type { TinyEndereco } from '@/lib/olist/types'
import { IoPrintOutline } from 'react-icons/io5'

interface Props {
  pedido: TinyPedidoCompleto
  onClose: () => void
  action?: React.ReactNode
  hideBuyer?: boolean
  hidePrices?: boolean
  hideCardMessage?: boolean
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

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  aberto:           { label: 'Aguardando pagamento', cls: 'bg-gray-100 text-gray-600' },
  aprovado:         { label: 'Pago',                 cls: 'bg-green-100 text-green-700' },
  preparando_envio: { label: 'Preparando',           cls: 'bg-blue-100 text-blue-700' },
  faturado:         { label: 'Faturado',             cls: 'bg-blue-100 text-blue-700' },
  pronto_envio:     { label: 'Pronto para envio',    cls: 'bg-blue-100 text-blue-700' },
  enviado:          { label: 'Saiu para entrega',    cls: 'bg-orange-100 text-orange-700' },
  entregue:         { label: 'Entregue',             cls: 'bg-green-100 text-green-800' },
  nao_entregue:     { label: 'Não entregue',         cls: 'bg-red-100 text-red-700' },
  cancelado:        { label: 'Cancelado',            cls: 'bg-red-100 text-red-700' },
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

export default function OrderDrawer({ pedido: p, onClose, action, hideBuyer, hidePrices, hideCardMessage }: Props) {
  const fromLI = isOrderFromLI(p.obs_interna)
  const liData = fromLI ? parseLIData(p.obs_interna) : null

  const clienteEndereco: TinyEndereco | undefined = fromLI && p.cliente.endereco
    ? {
        nome_destinatario: liData?.recipientName ?? '',
        endereco: p.cliente.endereco ?? '',
        numero: p.cliente.numero ?? '',
        complemento: p.cliente.complemento,
        bairro: p.cliente.bairro ?? '',
        cep: p.cliente.cep ?? '',
        cidade: p.cliente.cidade ?? '',
        uf: p.cliente.uf ?? '',
      }
    : undefined

  const endereco = p.enderecos?.[0]?.endereco ?? p.endereco_entrega ?? clienteEndereco
  const destinatario = fromLI ? liData?.recipientName : endereco?.nome_destinatario
  const mesmaPessoa = !destinatario || destinatario === p.cliente?.nome
  const telefoneComprador = p.cliente?.fone ? fmt(p.cliente.fone) : ''
  const celularComprador = p.cliente?.celular ? fmt(p.cliente.celular) : ''
  const obsUsuario = fromLI ? liData?.observations : parseObsUsuario(p.obs)
  const cardMessage = fromLI ? liData?.cardMessage : p.obs_interna
  const motoboy = parseMotoboy(p.obs)
  const recebidoPor = parseRecebidoPor(p.obs)
  const entregueEm = parseEntregue(p.obs)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg flex flex-col max-h-[94vh] md:max-h-[85vh] animate-modal-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="flex-none">
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="px-5 pb-3 pt-3 flex items-center justify-between border-b border-gray-100">
            <div>
              <span className="text-3xl font-bold font-mono text-gray-900">#{p.numero}</span>
              {p.numero_ecommerce && (
                <p className="text-xs text-gray-400 mt-0.5">Ref: {p.numero_ecommerce}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/print/${p.id}`}
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* ── Situação + datas + entrega ── */}
          <Section label="Pedido">
            {/* Status + data do pedido */}
            <div className="flex items-center justify-between gap-3 mb-4">
              {(() => {
                const badge = STATUS_BADGE[p.situacao?.toLowerCase().replace(/\s+/g, '_') ?? '']
                return (
                  <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${badge?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                    {badge?.label ?? p.situacao}
                  </span>
                )
              })()}
              {p.data_pedido && (
                <span className="text-xs text-gray-400 shrink-0">{p.data_pedido}</span>
              )}
            </div>

            {/* Entrega prevista — destaque */}
            {(p.data_prevista || liData?.scheduledDelivery || p.forma_frete) && (
              <div className="bg-gray-50 rounded-xl px-3 py-3 mb-4">
                <p className="text-xs text-gray-400 mb-0.5">Entrega prevista</p>
                {(p.data_prevista || liData?.scheduledDelivery) && (
                  <p className="text-xl font-bold text-gray-900">
                    {liData?.scheduledDelivery ?? p.data_prevista}
                  </p>
                )}
                {p.forma_frete && (
                  <p className="text-xs text-gray-500 mt-0.5">{p.forma_frete}</p>
                )}
              </div>
            )}

            {/* Dados de entrega */}
            {(motoboy || entregueEm || recebidoPor) && (
              <>
                <Divider />
                <div className="bg-gray-50 rounded-xl px-3 py-1 mt-4">
                  <Row label="Motoboy" value={motoboy} />
                  {entregueEm && (
                    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-400 shrink-0">Entregue em</span>
                      <span className="text-sm font-semibold text-gray-900 text-right">{entregueEm}</span>
                    </div>
                  )}
                  <Row label="Recebido por" value={recebidoPor} />
                </div>
              </>
            )}
          </Section>

          <Divider />

          {/* ── Comprador ── */}
          {!hideBuyer && (
            <>
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
                        <CopyPhoneButton number={telefoneComprador} display={p.cliente?.fone ?? telefoneComprador} />
                      </div>
                    )}
                    {celularComprador && celularComprador !== telefoneComprador && (
                      <CopyPhoneButton number={celularComprador} display={`Celular: ${p.cliente?.celular}`} />
                    )}
                  </div>
                )}

                {p.cliente?.email && (
                  <p className="text-xs text-gray-400 mt-2">{p.cliente.email}</p>
                )}
              </Section>

              <Divider />
            </>
          )}

          {/* ── Destinatário ── */}
          <Section label="Destinatário">
            <p className="font-semibold text-gray-900 mb-0.5">
              {destinatario ?? p.cliente?.nome}
            </p>
            {mesmaPessoa && (
              <p className="text-xs text-gray-400 mb-1">Mesmo que o comprador</p>
            )}
            {endereco?.fone && (
              <CopyPhoneButton number={fmt(endereco.fone)} display={endereco.fone} />
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
              <p className="text-xs text-gray-400">CEP {endereco?.cep}</p>
              <p className="text-xs text-gray-400">{endereco?.cidade} / {endereco?.uf}</p>
            </div>
            {hideBuyer && endereco && (() => {
              const addr = [
                endereco.endereco,
                endereco.numero,
                endereco.complemento,
                endereco.bairro,
                endereco.cidade,
                endereco.uf,
              ].filter(Boolean).join(', ')
              const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(addr)}&navigate=yes`
              const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(addr)}`
              return (
                <div className="flex gap-2 mt-3">
                  <a
                    href={wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition-colors"
                  >
                    Abrir no Waze
                  </a>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-sm font-semibold bg-gray-700 hover:bg-gray-800 text-white py-2.5 rounded-xl transition-colors"
                  >
                    Abrir no Maps
                  </a>
                </div>
              )
            })()}
          </Section>

          {/* ── Observações ── */}
          {obsUsuario && (
            <>
              <Divider />
              <Section label="Observações">
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed whitespace-pre-line">
                  {obsUsuario}
                </p>
              </Section>
            </>
          )}

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
                      {!hidePrices && (
                        <span className="text-sm font-medium text-gray-700">
                          R$ {i.item.valor_total ?? i.item.valor_unitario}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── Mensagem do cartão ── */}
          {(!hideCardMessage && cardMessage) && (
            <>
              <Divider />
              <Section label="Mensagem do cartão">
                <p className="text-sm text-pink-900 italic bg-pink-50 rounded-xl px-3 py-2.5 leading-relaxed">
                  {cardMessage}
                </p>
              </Section>
            </>
          )}

          {/* ── Financeiro ── */}
          {!hidePrices && (
            <>
              <Divider />
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
            </>
          )}
        </div>

        {/* Fixed footer */}
        {action && (
          <div className="flex-none border-t border-gray-100 px-5 py-4">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
