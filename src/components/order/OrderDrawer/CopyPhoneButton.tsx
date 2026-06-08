'use client'

import { useState } from 'react'

export function CopyPhoneButton({ number, display }: { number: string; display: string }) {
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
