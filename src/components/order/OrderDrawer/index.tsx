'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { IoPrintOutline, IoCopyOutline, IoCheckmarkOutline, IoTimeOutline, IoCloseOutline, IoCreateOutline } from 'react-icons/io5'
import { useOrderDetail } from '@/hooks/useOrderDetail'
import { useUser } from '@/contexts/UserContext'
import { canSeeDrawerFeature } from '@/constants/orderDrawerFeatures'
import { HistoryPanel } from './HistoryPanel'
import { OrderSections } from './OrderSections'
import { DrawerFooter } from './DrawerFooter'
import { ActionModal } from './ActionModal'
import { DrawerActionEdit } from './DrawerActionEdit'

interface Props {
  id: number
  onClose: () => void
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

export default function OrderDrawer({ id, onClose }: Props) {
  const { order, loading, error, refresh } = useOrderDetail(id)
  const [showHistory, setShowHistory] = useState(false)
  const [copiedConfirmation, setCopiedConfirmation] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const role = useUser()?.role ?? null
  const canSee = (feature: Parameters<typeof canSeeDrawerFeature>[1]) =>
    canSeeDrawerFeature(role, feature)

  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    history.pushState({ drawer: true }, '')
    const onPop = () => onCloseRef.current()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const handleClose = useCallback(() => {
    history.back()
    onClose()
  }, [onClose])

  function copyConfirmation() {
    if (!order) return
    const msg = order.pickup
      ? [
          `Obrigado por sua compra! 🌸`,
          ``,
          `➡️ O número do seu pedido é *${order.id}*`,
          ``,
          `Seu pedido estará disponível para retirada na nossa loja.`,
          ``,
          `Na hora da retirada, informe o número do pedido *${order.id}*. 😊`,
        ].join('\n')
      : [
          `Obrigado por sua compra! 🌸`,
          ``,
          `➡️ O número do seu pedido é *${order.id}*`,
          ``,
          `Acompanhe seu pedido pelo link abaixo:`,
          `${process.env.NEXT_PUBLIC_SITE_URL}/tracking/${order.trackingToken}`,
        ].join('\n')
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedConfirmation(true)
      setTimeout(() => setCopiedConfirmation(false), 2000)
    })
  }


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
            <div className="flex flex-col gap-0.5">
              <span className="text-3xl font-bold font-mono text-gray-900">
                #{order?.id ?? '—'}
              </span>
              {canSee('olistBadge') && order?.source === 'loja_integrada' && (
                <div className="flex items-center gap-1.5">
                  <Image src="/lojaintegrada-icon.svg" alt="Loja Integrada" width={14} height={14} className="rounded-sm" />
                  <span className="text-xs text-gray-500">
                    Loja Integrada · <span className="font-mono">{order.olistNumero ?? order.id}</span>
                  </span>
                </div>
              )}
              {canSee('olistBadge') && order?.source !== 'loja_integrada' && (
                <div className="flex items-center gap-1.5">
                  <Image src="/olist-icon.png" alt="Olist" width={14} height={14} className={`rounded-sm ${!order?.olistNumero ? 'grayscale' : ''}`} />
                  <span className={`text-xs ${order?.olistNumero ? 'text-gray-500' : 'text-yellow-700'}`}>
                    Olist · {order?.olistNumero ? <span className="font-mono">{order.olistNumero}</span> : 'Não sincronizado'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {canSee('editOrder') && order && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Editar pedido"
                >
                  <IoCreateOutline size={20} />
                </button>
              )}
              {canSee('historyPanel') && (
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className={`p-2 rounded-lg transition-colors ${showHistory ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                  aria-label="Histórico de ações"
                >
                  <IoTimeOutline size={20} />
                </button>
              )}
              {canSee('confirmationCopy') && (
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
              {canSee('printButton') && order && (
                <button
                  onClick={() => window.open(`/print/${order.id}`, '_blank')}
                  className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Imprimir pedido"
                >
                  <IoPrintOutline size={20} />
                </button>
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
          {error && !order && <LoadingState onRetry={refresh} />}
          {order && (
            canSee('historyPanel') && showHistory
              ? <HistoryPanel entries={order.history} />
              : <OrderSections order={order} />
          )}
        </div>

        {/* Desktop: duas colunas */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {loading && !order && <LoadingState />}
            {error && !order && <LoadingState onRetry={refresh} />}
            {order && <OrderSections order={order} />}
          </div>

          {canSee('historyPanel') && showHistory && (
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

        {/* Footer: actions */}
        {order && <DrawerFooter order={order} canSee={canSee} onClose={handleClose} refresh={refresh} />}

        {/* Edit modal */}
        {editOpen && order && (
          <ActionModal title="Editar pedido" onClose={() => setEditOpen(false)} size="md">
            <DrawerActionEdit order={order} onSuccess={() => { setEditOpen(false); void refresh() }} />
          </ActionModal>
        )}
      </div>
    </div>
  )
}
