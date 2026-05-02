'use client'

import { useState } from 'react'

const MOCK_PEDIDO = {
  sku: 'AR06',
  produto: 'Arranjo Mix de Flores com Ferrero Rocher',
  comprador: 'Alessandro — (11) 96475-7574',
  destinatario: 'Mariana Lopes — (11) 93431-3438',
  mensagem: 'Eu te amo',
  endereco: 'Estrada Imperial, 300 — Vila São Paulo, Mogi das Cruzes / SP',
  cep: '08840-070',
  entrega: '08/05/2026 — Qualquer horário',
  produto_valor: 'R$ 169,90',
  frete: 'R$ 15,00',
  total: 'R$ 184,90',
}

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePagar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/debug/pagamento', { method: 'POST' })
      const data = (await res.json()) as { redirectUrl?: string; error?: string }
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? 'Erro desconhecido')
        return
      }
      window.location.href = data.redirectUrl
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <p className="text-xs text-amber-400 uppercase tracking-widest mb-1">Ambiente de debug</p>
          <h1 className="text-2xl font-bold">Checkout PRO — MercadoPago</h1>
          <p className="text-gray-400 text-sm mt-1">Cria uma preferência real no MP sem criar pedido no Olist.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2 text-sm">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Payload mockado</p>
          {Object.entries(MOCK_PEDIDO).map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <span className="text-gray-500 w-36 shrink-0">{k}</span>
              <span className="text-gray-200">{v}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePagar}
          disabled={loading}
          className="w-full bg-[#009EE3] hover:bg-[#007FBD] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-sm"
        >
          {loading ? 'Criando preferência...' : 'Pagar com MercadoPago →'}
        </button>
      </div>
    </main>
  )
}
