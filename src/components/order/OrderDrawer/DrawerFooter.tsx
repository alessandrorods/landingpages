'use client'

import { useState, useEffect, useRef } from 'react'
import { IoChevronDown } from 'react-icons/io5'
import { ActionModal } from './ActionModal'
import { DrawerActionApprove } from './DrawerActionApprove'
import { DrawerActionStartPreparing } from './DrawerActionStartPreparing'
import { DrawerActionMarkReady } from './DrawerActionMarkReady'
import { DrawerActionDispatch } from './DrawerActionDispatch'
import { DrawerActionDeliver } from './DrawerActionDeliver'
import { DrawerActionConfirmPickup } from './DrawerActionConfirmPickup'
import { DrawerActionCancel } from './DrawerActionCancel'
import { DrawerActionRecover } from './DrawerActionRecover'
import { DrawerActionUndeliver } from './DrawerActionUndeliver'
import { DrawerActionReschedule } from './DrawerActionReschedule'
import { DrawerActionForceStatus } from './DrawerActionForceStatus'
import type { OrderDrawerFeature } from '@/constants/orderDrawerFeatures'
import type { OrderDTO } from '@/domains/orders/order.types'

type ModalKey = 'dispatch' | 'deliver' | 'confirmPickup' | 'reschedule' | 'undeliver' | 'recover' | 'cancel' | 'forceStatus'

const MODAL_TITLES: Record<ModalKey, string> = {
  dispatch:      'Despachar pedido',
  deliver:       'Confirmar entrega',
  confirmPickup: 'Confirmar retirada',
  reschedule:    'Reagendar entrega',
  undeliver:     'Não entregue',
  recover:       'Recuperar pedido',
  cancel:        'Cancelar pedido',
  forceStatus:   'Forçar alteração de status',
}

interface Props {
  order: OrderDTO
  canSee: (feature: OrderDrawerFeature) => boolean
  onClose: () => void
  refresh: () => void | Promise<void>
}

export function DrawerFooter({ order, canSee, onClose, refresh }: Props) {
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const asyncRefresh = () => Promise.resolve(refresh())

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [dropdownOpen])

  function openModal(key: ModalKey) {
    setDropdownOpen(false)
    setActiveModal(key)
  }

  function closeModal() { setActiveModal(null) }
  function closeModalAndDrawer() { setActiveModal(null); onClose() }

  const nonFinalStatus = !['delivered', 'cancelled', 'undelivered'].includes(order.status)

  // ── Visibility ────────────────────────────────────────────────────────────
  const showApprove        = canSee('actionApprove')        && order.status === 'pending'
  const showStartPreparing = canSee('actionStartPreparing') && order.status === 'approved'
  const showMarkReady      = canSee('actionMarkReady')      && order.status === 'preparing'
  const showDispatch       = canSee('actionDispatch')       && order.status === 'ready' && !order.pickup
  const showConfirmPickup  = canSee('actionConfirmPickup')  && order.status === 'available_for_pickup'
  const showDeliver        = canSee('actionDeliver')        && order.status === 'dispatched'
  const showUndeliver      = canSee('actionUndeliver')      && order.status === 'dispatched'
  const showReschedule     = canSee('actionReschedule')     && order.status === 'undelivered'
  const showRecover        = canSee('actionRecover')        && order.status === 'pending'
  const showCancel         = canSee('actionCancel')         && nonFinalStatus
  const showForceStatus    = canSee('actionForceStatus')

  // ── Primary ───────────────────────────────────────────────────────────────
  // Direct-fire (no form): render component inline
  // Form-based: render a styled button that opens modal
  const directPrimary = (() => {
    if (showApprove)        return <DrawerActionApprove        order={order} refresh={asyncRefresh} />
    if (showStartPreparing) return <DrawerActionStartPreparing order={order} refresh={asyncRefresh} />
    if (showMarkReady)      return <DrawerActionMarkReady      order={order} close={onClose} />
    return null
  })()

  const modalPrimaryBtn = (() => {
    if (showDispatch)      return { key: 'dispatch'      as ModalKey, label: '🏍 Despachar pedido',      cls: 'bg-orange-500 hover:bg-orange-600' }
    if (showConfirmPickup) return { key: 'confirmPickup' as ModalKey, label: '🏪 Confirmar Retirada',    cls: 'bg-purple-600 hover:bg-purple-700' }
    if (showDeliver)       return { key: 'deliver'       as ModalKey, label: '✓ Confirmar Entrega',      cls: 'bg-green-600 hover:bg-green-700' }
    if (showReschedule)    return { key: 'reschedule'    as ModalKey, label: 'Reagendar entrega',         cls: 'bg-blue-600 hover:bg-blue-700' }
    return null
  })()

  const hasPrimary = !!(directPrimary || modalPrimaryBtn)

  // ── Secondary (in dropdown) ───────────────────────────────────────────────
  type SecondaryItem = { key: ModalKey; label: string; destructive?: boolean }
  const secondaryItems: SecondaryItem[] = [
    showUndeliver                    && { key: 'undeliver',   label: 'Não entregue' },
    showRecover                      && { key: 'recover',     label: 'Recuperar pedido' },
    hasPrimary && showForceStatus    && { key: 'forceStatus', label: 'Forçar status' },
    showCancel                       && { key: 'cancel',      label: 'Cancelar pedido', destructive: true },
  ].filter(Boolean) as SecondaryItem[]

  const hasSecondary = secondaryItems.length > 0

  // Nothing to show
  if (!hasPrimary && !showForceStatus && !hasSecondary) return null

  return (
    <>
      <div className="flex-none border-t border-gray-100 px-5 py-4">
        <div className="flex gap-2 items-stretch">

          {/* Primary */}
          <div className="flex-1 min-w-0">
            {directPrimary}

            {modalPrimaryBtn && (
              <button
                onClick={() => openModal(modalPrimaryBtn.key)}
                className={`w-full ${modalPrimaryBtn.cls} text-white font-semibold py-3 rounded-xl text-sm transition-colors`}
              >
                {modalPrimaryBtn.label}
              </button>
            )}

            {/* Terminal states for admin: forceStatus as sole primary */}
            {!hasPrimary && showForceStatus && (
              <button
                onClick={() => openModal('forceStatus')}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Forçar alteração de status
              </button>
            )}
          </div>

          {/* ⋯ dropdown */}
          {hasSecondary && (
            <div ref={dropdownRef} className="relative flex-none">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className={`h-full px-3.5 rounded-xl border transition-colors ${
                  dropdownOpen
                    ? 'bg-gray-200 border-gray-300 text-gray-700'
                    : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:border-gray-300'
                }`}
                aria-label="Mais ações"
              >
                <IoChevronDown size={16} />
              </button>

              {dropdownOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-10">
                  {secondaryItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => openModal(item.key)}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        item.destructive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <ActionModal title={MODAL_TITLES[activeModal]} onClose={closeModal}>
          {activeModal === 'dispatch'      && <DrawerActionDispatch      order={order} close={closeModalAndDrawer} />}
          {activeModal === 'deliver'       && <DrawerActionDeliver       order={order} close={closeModalAndDrawer} />}
          {activeModal === 'confirmPickup' && <DrawerActionConfirmPickup order={order} close={closeModalAndDrawer} />}
          {activeModal === 'reschedule'    && <DrawerActionReschedule    order={order} close={closeModalAndDrawer} />}
          {activeModal === 'undeliver'     && <DrawerActionUndeliver     order={order} close={closeModalAndDrawer} />}
          {activeModal === 'recover'       && <DrawerActionRecover       order={order} />}
          {activeModal === 'cancel'        && <DrawerActionCancel        order={order} close={closeModalAndDrawer} defaultConfirm />}
          {activeModal === 'forceStatus'   && <DrawerActionForceStatus   order={order} refresh={() => { closeModal(); void refresh() }} defaultOpen />}
        </ActionModal>
      )}
    </>
  )
}
