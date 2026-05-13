'use client'

import { useEffect } from 'react'
import { trackViewItemList, type AnalyticsItem } from '@/core/analytics'

export default function PageViewEvents({ items }: { items: AnalyticsItem[] }) {
  useEffect(() => {
    trackViewItemList(items)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
