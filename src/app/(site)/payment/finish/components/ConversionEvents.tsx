'use client'

import { useEffect } from 'react'
import { trackPurchase, type PurchaseData } from '@/core/analytics'

// Deduplicação dupla:
// 1. sessionStorage: impede re-disparo em F5 na mesma sessão.
// 2. GA4 e Meta deduplicam por transaction_id no back-end deles.

export default function ConversionEvents({ purchase }: { purchase: PurchaseData }) {
  useEffect(() => {
    const key = `conversion_fired_${purchase.transaction_id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    trackPurchase(purchase)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
