'use client'

import { useState, useEffect, useRef } from 'react'
import { IoLogoWhatsapp } from 'react-icons/io5'
import { CopyPhoneButton } from './CopyPhoneButton'
import { useDrawerAction } from './useDrawerAction'
import type { OrderDTO } from '@/domains/orders/order.types'

type Step = 'trigger' | 'recipient' | 'buyer' | 'occurrence'


interface Props {
  order: OrderDTO
  close: () => void
}

export function DrawerActionUndeliver({ order, close }: Props) {
  const [step, setStep] = useState<Step>('trigger')
  const [reasons, setReasons] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { loading, err, run } = useDrawerAction()

  useEffect(() => {
    if (step === 'occurrence') {
      fetch('/api/admin/config/undelivered-reasons')
        .then((r) => r.json())
        .then((d) => {
          const list = d.reasons as string[] | undefined
          if (list?.length) setReasons(list)
        })
        .catch(() => {})

      navigator.geolocation?.getCurrentPosition(
        ({ coords: c }) => setCoords({ lat: c.latitude, lng: c.longitude }),
        () => {},
      )
    }
  }, [step])

  const isSamePerson = order.buyerPhone.replace(/\D/g, '') === order.recipientPhone.replace(/\D/g, '')

  const STEP_INDEX: Record<Step, number> = isSamePerson
    ? { trigger: 0, recipient: 1, buyer: 1, occurrence: 2 }
    : { trigger: 0, recipient: 1, buyer: 2, occurrence: 3 }

  const STEP_LABELS = isSamePerson
    ? ['Tentativa de contato', 'Registrar ocorrência']
    : ['Contato destinatário', 'Contato comprador', 'Registrar ocorrência']

  function whatsappLink(phone: string, name: string) {
    const cleaned = phone.replace(/\D/g, '')
    const number = cleaned.startsWith('55') ? cleaned : `55${cleaned}`
    const msg = encodeURIComponent(
      `Olá ${name}, sou o entregador do seu pedido #${order.id}. Estou no endereço mas não estou conseguindo realizar a entrega. Pode me atender?`,
    )
    return `https://wa.me/${number}?text=${msg}`
  }

  async function submit() {
    await run(async () => {
      const photoUrls: string[] = []
      for (const file of photos) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
        if (!res.ok) throw new Error('Falha ao enviar foto')
        const { url } = await res.json()
        photoUrls.push(url)
      }

      const res = await fetch(`/api/admin/orders/${order.id}/undelivered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          notes: notes.trim() || undefined,
          photoUrls,
          lat: coords?.lat,
          lng: coords?.lng,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao registrar ocorrência')
      close()
    })
  }

  const isOther = reason === reasons[reasons.length - 1] && reason !== ''
  const currentIdx = STEP_INDEX[step]

  // ── Step 1: trigger ───────────────────────────────────────────────────────
  if (step === 'trigger') {
    return (
      <button
        onClick={() => setStep('recipient')}
        className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-3.5 rounded-xl text-sm transition-colors border border-red-200"
      >
        Não estou conseguindo realizar a entrega
      </button>
    )
  }

  // ── Steps 2–4: inside occurrence flow container ───────────────────────────
  return (
    <div className="rounded-2xl border-2 border-red-300 bg-red-50 overflow-hidden">

      {/* Progress header */}
      <div className="bg-red-600 px-4 py-2.5 flex items-center gap-3">
        <span className="text-xs font-bold text-red-200 uppercase tracking-wider shrink-0">
          Ocorrência
        </span>
        <div className="flex items-center gap-1.5 flex-1">
          {STEP_LABELS.map((label, i) => {
            const done = i < currentIdx - 1
            const active = i === currentIdx - 1
            return (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${done ? 'bg-red-300 text-red-800' : active ? 'bg-white text-red-700' : 'bg-red-500 text-red-300'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium truncate hidden sm:block
                  ${active ? 'text-white' : done ? 'text-red-300' : 'text-red-400'}`}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`w-4 h-px shrink-0 ${done ? 'bg-red-300' : 'bg-red-500'}`} />
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setStep('trigger')}
          className="shrink-0 text-red-200 hover:text-white transition-colors text-xl leading-none px-1"
          aria-label="Cancelar ocorrência"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-3">

        {/* ── Step 2: recipient ── */}
        {step === 'recipient' && (
          <>
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-0.5">
                Tentativa 1 — Destinatário
              </p>
              <p className="text-sm text-gray-500">
                Entre em contato com quem deve receber o pedido.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-red-100 p-3 space-y-2.5">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Nome</p>
                <p className="text-base font-bold text-gray-900">{order.recipientName}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={whatsappLink(order.recipientPhone, order.recipientName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <IoLogoWhatsapp size={16} />
                  WhatsApp
                </a>
                <CopyPhoneButton number={order.recipientPhone} display="Copiar telefone" />
              </div>
            </div>
            <button
              onClick={() => setStep(isSamePerson ? 'occurrence' : 'buyer')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
            >
              Não consegui contato
            </button>
          </>
        )}

        {/* ── Step 3: buyer ── */}
        {step === 'buyer' && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wide">
                  Tentativa 2 — Comprador
                </p>
                <span className="text-xs bg-red-200 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                  Destinatário não atendeu
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Tente agora contato com quem fez o pedido.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-red-100 p-3 space-y-2.5">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Nome</p>
                <p className="text-base font-bold text-gray-900">{order.buyerName}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={whatsappLink(order.buyerPhone, order.buyerName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <IoLogoWhatsapp size={16} />
                  WhatsApp
                </a>
                <CopyPhoneButton number={order.buyerPhone} display="Copiar telefone" />
              </div>
            </div>
            <button
              onClick={() => setStep('occurrence')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
            >
              Não consegui contato com o comprador
            </button>
          </>
        )}

        {/* ── Step 4: occurrence ── */}
        {step === 'occurrence' && (
          <>
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-0.5">
                Passo 3 — Registrar ocorrência
              </p>
              <p className="text-sm text-gray-500">
                Tire fotos do local e selecione o motivo.
              </p>
            </div>

            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white"
            >
              <option value="">Selecione o motivo</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {(isOther || notes) && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isOther ? 'Descreva o motivo (obrigatório)' : 'Observações (opcional)'}
                rows={2}
                className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none bg-white"
              />
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) setPhotos((prev) => [...prev, ...Array.from(e.target.files!)])
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-red-300 rounded-xl py-2.5 text-sm text-red-400 hover:border-red-400 hover:text-red-600 bg-white transition-colors"
              >
                + Adicionar fotos {photos.length > 0 ? `(${photos.length})` : ''}
              </button>
              {photos.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {photos.map((f, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(f)}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg border border-red-200"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {coords && (
              <p className="text-xs text-green-700 font-medium">✓ Localização capturada</p>
            )}

            {err && <p className="text-xs text-red-700">{err}</p>}

            <button
              onClick={submit}
              disabled={loading || !reason || (isOther && !notes.trim())}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-base transition-colors"
            >
              {loading ? 'Registrando...' : 'Finalizar pedido. Voltar para a loja'}
            </button>
          </>
        )}

      </div>
    </div>
  )
}
