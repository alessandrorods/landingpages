import { useState } from 'react'

interface UseDrawerActionResult {
  loading: boolean
  err: string
  run: (fn: () => Promise<void>) => Promise<void>
}

export function useDrawerAction(): UseDrawerActionResult {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function run(fn: () => Promise<void>) {
    setLoading(true)
    setErr('')
    try {
      await fn()
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return { loading, err, run }
}
