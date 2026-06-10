import { useState, useEffect } from 'react'
import type { PeriodoEntrega } from '@/constants/pedido.types'

interface State {
  periods: PeriodoEntrega[]
  preparationTimeMinutes: number
  loading: boolean
}

export function useDeliveryPeriods(enabled = true): State {
  const [state, setState] = useState<State>({ periods: [], preparationTimeMinutes: 60, loading: enabled })

  useEffect(() => {
    if (!enabled) return
    fetch('/api/periods')
      .then((r) => r.json())
      .then((d: { periods: PeriodoEntrega[]; preparationTimeMinutes: number }) =>
        setState({ periods: d.periods, preparationTimeMinutes: d.preparationTimeMinutes, loading: false }),
      )
      .catch(() => setState({ periods: [], preparationTimeMinutes: 60, loading: false }))
  }, [enabled])

  return state
}
