'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { IoPrintOutline, IoRefreshOutline, IoCopyOutline, IoCheckmarkOutline, IoTimeOutline, IoCloseOutline } from 'react-icons/io5'
import { useOrderDetail } from '@/hooks/useOrderDetail'
import { useUser } from '@/contexts/UserContext'
import { HistoryPanel } from './HistoryPanel'
import { OrderSections } from './OrderSections'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  id: number
  onClose: () => void
  footer?: (order: OrderDTO) => React.ReactNode
}

function useOrderVisibility(order: OrderDTO | null) {
  const { role } = useUser()
  if (!order) return null
  return {
    showBuyer:            role !== 'motoboy',
    showPrices:           role !== 'motoboy',
    showCardMessage:      role !== 'motoboy',
    showConfirmationCopy: (role === 'vendas' || role === 'admin') && order.status === 'approved',
  }
}

function LoadingState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {onRetry
        ? <><p className="text-sm text-red-600">Não foi possível carregar o pedido</p>
            <button onClick={onRetry} className="text-sm text-blue-600 font-semibold underline">Tentar novamente</button></>
        : <><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Carregando pedido…</p></>}
    </div>
  )
}

export default function OrderDrawer({ id, onClose, footer }: Props) {
  const { order, loading, error, refresh } = useOrderDetail(id)
  const [showHistory, setShowHistory] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [copiedConfirmation, setCopiedConfirmation] = useState(false)
  const visibility = useOrderVisibility(order)

  // Keep a stable ref to onClose so the effect doesn't re-run when the parent re-renders
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Push a history entry when the drawer opens so the back button closes it
  useEffect(() => {
    history.pushState({ drawer: true }, '')
    const onPop = () => onCloseRef.current()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Close via UI — also pop the history entry we pushed
  const handleClose = useCallback(() => {
    history.back()
    onClose()
  }, [onClose])

  const handleRefresh = useCallback(async () => {
    setSyncing(true)
    await refresh()
    setSyncing(false)
  }, [refresh])

  function copyConfirmation() {
    if (!order) return
    const msg = `Obrigado por sua compra!\n\n➡️ O número do seu pedido é *${order.id}*\n\nAcompanhe seu pedido pelo link abaixo:\nhttps://florapp.com.br/tracking/${order.id}`
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedConfirmation(true)
      setTimeout(() => setCopiedConfirmation(false), 2000)
    })
  }

  const isSpinning = syncing || (loading && !!order)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div
        className={`relative bg-white rounded-t-3xl md:rounded-3xl w-full flex flex-col max-h-[94vh] md:max-h-[85vh] animate-modal-slide-up transition-[max-width] duration-200 ${showHistory ? 'md:max-w-5xl' : 'md:max-w-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none">
          <div className="px-5 pb-3 pt-4 flex items-center justify-between border-b border-gray-100">
            <span className="text-3xl font-bold font-mono text-gray-900">
              #{order?.id ?? '—'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory((v) => !v)}
                className={`p-2 rounded-lg transition-colors ${showHistory ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                aria-label="Histórico de ações"
              >
                <IoTimeOutline size={20} />
              </button>
              <button
                onClick={handleRefresh}
                disabled={syncing}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40"
                aria-label="Recarregar pedido"
              >
                <IoRefreshOutline size={20} className={isSpinning ? 'animate-spin' : ''} />
              </button>
              {visibility?.showConfirmationCopy && (
                <button
                  onClick={copyConfirmation}
                  className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Copiar mensagem de confirmação"
                >
                  {copiedConfirmation
                    ? <IoCheckmarkOutline size={20} className="text-green-500" />
                    : <IoCopyOutline size={20} />}
                </button>
              )}
              {order && (
                <a
                  href={`/print/${order.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Imprimir pedido"
                >
                  <IoPrintOutline size={20} />
                </a>
              )}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors ml-1"
                aria-label="Fechar"
              >
                <IoCloseOutline size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile: coluna única com toggle */}
        <div className="md:hidden flex-1 overflow-y-auto px-5 py-5">
          {loading && !order && <LoadingState />}
          {error && !order && <LoadingState onRetry={handleRefresh} />}
          {order && (
            showHistory
              ? <HistoryPanel entries={order.history} />
              : visibility && <OrderSections order={order} {...visibility} />
          )}
        </div>

        {/* Desktop: duas colunas */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* Coluna esquerda — detalhes do pedido */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {loading && !order && <LoadingState />}
            {error && !order && <LoadingState onRetry={handleRefresh} />}
            {order && visibility && <OrderSections order={order} {...visibility} />}
          </div>

          {/* Coluna direita — histórico */}
          {showHistory && (
            <>
              <div className="w-px bg-gray-100 flex-none" />
              <div className="w-96 flex-none flex flex-col overflow-hidden bg-gray-50 rounded-br-3xl">
                <p className="flex-none text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-5 pb-3">
                  Histórico
                </p>
                <div className="flex-1 overflow-y-auto px-4 pb-5">
                  {order
                    ? <HistoryPanel entries={order.history} />
                    : <div className="py-8 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {order && footer && (
          <div className="flex-none border-t border-gray-100 px-5 py-4">
            {footer(order)}
          </div>
        )}
      </div>
    </div>
  )
}
