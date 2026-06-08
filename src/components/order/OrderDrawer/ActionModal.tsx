'use client'

import { useEffect, useRef } from 'react'
import { IoCloseOutline } from 'react-icons/io5'

interface Props {
  title: string
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md'
}

export function ActionModal({ title, onClose, children, size = 'sm' }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on back-navigation (browser back button)
  useEffect(() => {
    history.pushState({ actionModal: true }, '')
    const onPop = () => onClose()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-60 flex flex-col justify-end md:justify-center md:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={panelRef}
        className={`relative bg-white rounded-t-3xl md:rounded-3xl w-full flex flex-col max-h-[85vh] animate-modal-slide-up ${size === 'md' ? 'md:max-w-lg' : 'md:max-w-sm'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 flex-none">
          <p className="font-semibold text-gray-900 text-base">{title}</p>
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
          {children}
        </div>
      </div>
    </div>
  )
}
