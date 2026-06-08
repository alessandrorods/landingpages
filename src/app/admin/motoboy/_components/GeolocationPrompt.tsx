'use client'

import { useState, useEffect } from 'react'

type PermState = 'loading' | 'granted' | 'denied' | 'prompt'

export function GeolocationPrompt() {
  const [state, setState] = useState<PermState>('loading')

  useEffect(() => {
    if (!navigator.geolocation) {
      setState('denied')
      return
    }

    // Trigger immediately so the browser shows the native permission prompt on load.
    navigator.geolocation.getCurrentPosition(
      () => setState('granted'),
      (err) => {
        // code 1 = PERMISSION_DENIED, code 3 = TIMEOUT (user did not explicitly deny)
        setState(err.code === 1 ? 'denied' : 'prompt')
      },
      { timeout: 8000, maximumAge: 60000 },
    )
  }, [])

  function retry() {
    setState('loading')
    navigator.geolocation.getCurrentPosition(
      () => setState('granted'),
      (err) => setState(err.code === 1 ? 'denied' : 'prompt'),
      { timeout: 8000 },
    )
  }

  if (state === 'loading' || state === 'granted') return null

  if (state === 'denied') {
    return (
      <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-red-700 mb-1">Localização bloqueada</p>
        <p className="text-xs text-red-600 mb-2">
          A permissão de localização foi negada. Para habilitar:
        </p>
        <ol className="text-xs text-red-600 space-y-1 list-decimal list-inside mb-3">
          <li>Toque no ícone de cadeado ou informações na barra de endereço do navegador</li>
          <li>Selecione <strong>Permissões</strong> ou <strong>Configurações do site</strong></li>
          <li>Ative <strong>Localização</strong></li>
          <li>Recarregue a página</li>
        </ol>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          Recarregar página
        </button>
      </div>
    )
  }

  // state === 'prompt' — browser timed out or permission not yet answered
  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <p className="text-sm font-semibold text-amber-800 mb-1">Permitir localização</p>
      <p className="text-xs text-amber-700 mb-3">
        Toque no botão abaixo. Quando o navegador perguntar, selecione <strong>Permitir</strong>.
      </p>
      <button
        onClick={retry}
        className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
      >
        Solicitar permissão
      </button>
    </div>
  )
}
