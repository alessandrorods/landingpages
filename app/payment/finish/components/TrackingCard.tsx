'use client'

import { useState } from 'react'

export function TrackingCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard não disponível — silencia
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-[#1E7439] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📦</span>
        <div>
          <p className="font-bold text-gray-900 text-base leading-tight">Acompanhe seu pedido</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Salve o link abaixo para ver o status em tempo real a qualquer momento.
          </p>
        </div>
      </div>

      {/* URL copiável */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5">
        <span className="flex-1 text-xs font-mono text-gray-600 truncate select-all">{url}</span>
        <button
          onClick={copy}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1E7439] text-white hover:bg-[#155C2C] transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar link
            </>
          )}
        </button>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-[#1E7439] text-[#1E7439] font-semibold text-sm hover:bg-[#F0F9F3] transition-colors"
      >
        Abrir rastreio
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}
