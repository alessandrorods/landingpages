import { useState, useEffect } from 'react'
import type { DeliveryRegion } from '@/domains/config/config.types'

interface State {
  regions: DeliveryRegion[]
  loading: boolean
}

export function useDeliveryRegions(enabled = true): State {
  const [state, setState] = useState<State>({ regions: [], loading: enabled })

  useEffect(() => {
    if (!enabled) return
    fetch('/api/delivery-regions')
      .then((r) => r.json())
      .then((data) => setState({ regions: Array.isArray(data) ? data : [], loading: false }))
      .catch(() => setState({ regions: [], loading: false }))
  }, [enabled])

  return state
}
