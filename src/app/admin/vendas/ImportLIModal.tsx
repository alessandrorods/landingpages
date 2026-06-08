'use client'

import { useState, useRef, useEffect } from 'react'
import { IoCloseOutline, IoCheckmarkCircle, IoOpenOutline } from 'react-icons/io5'
import Image from 'next/image'

interface Props {
  onClose: () => void
  onImported: (orderId: number) => void
}

type State =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'success'; orderId: number }
  | { phase: 'error'; message: string }

export function ImportLIModal({ onClose, onImported }: Props) {
  const [numero, setNumero] = useState('')
  const [state, setState] = useState<State>({ phase: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    history.pushState({ importLIModal: true }, '')
    const onPop = () => onClose()
    window.addEventListener('popstate', onPop)
    inputRef.current?.focus()
    return () => window.removeEventListener('popstate', onPop)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(numero.trim(), 10)
    if (!n) return

    setState({ phase: 'loading' })
    try {
      const res = await fetch('/api/admin/orders/import-li', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liNumero: n }),
      })
      const data = await res.json() as { ok?: boolean; orderId?: number; error?: string }
      if (!res.ok || !data.ok) {
        setState({ phase: 'error', message: data.error ?? 'Erro desconhecido' })
        return
      }
      setState({ phase: 'success', orderId: data.orderId! })
      onImported(data.orderId!)
    } catch {
      setState({ phase: 'error', message: 'Falha na conexão. Tente novamente.' })
    }
  }

  function handleNewImport() {
    setNumero('')
    setState({ phase: 'idle' })
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="fixed inset-0 z-60 flex flex-col justify-end md:justify-center md:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-sm flex flex-col max-h-[85vh] animate-modal-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 flex-none">
          <div className="flex items-center gap-2">
            <Image src="/lojaintegrada-icon.svg" alt="Loja Integrada" width={16} height={16} className="rounded-sm" />
            <p className="font-semibold text-gray-900 text-base">Importar da Loja Integrada</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <IoCloseOutline size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {state.phase !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Número do pedido na LI
                </label>
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  value={numero}
                  onChange={(e) => {
                    setNumero(e.target.value)
                    if (state.phase === 'error') setState({ phase: 'idle' })
                  }}
                  placeholder="Ex: 401"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                  disabled={state.phase === 'loading'}
                />
              </div>

              {state.phase === 'error' && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{state.message}</p>
              )}

              <button
                type="submit"
                disabled={!numero.trim() || state.phase === 'loading'}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {state.phase === 'loading' ? 'Importando…' : 'Importar pedido'}
              </button>
            </form>
          )}

          {state.phase === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="flex justify-center">
                <IoCheckmarkCircle size={48} className="text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Pedido importado!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Pedido <span className="font-mono font-bold">#{state.orderId}</span> criado com sucesso.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleNewImport}
                  className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Importar outro
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <IoOpenOutline size={15} />
                  Ver pedidos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
