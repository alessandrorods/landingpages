import { useState, useEffect } from 'react'
import type { PeriodoEntrega } from '@/constants/pedido.types'

interface State {
  periods: PeriodoEntrega[]
  loading: boolean
}

export function useDeliveryPeriods(): State {
  const [state, setState] = useState<State>({ periods: [], loading: true })

  useEffect(() => {
    fetch('/api/periods')
      .then((r) => r.json())
      .then((d: { periods: PeriodoEntrega[] }) => setState({ periods: d.periods, loading: false }))
      .catch(() => setState({ periods: [], loading: false }))
  }, [])

  return state
}
