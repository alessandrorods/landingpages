'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

// Rastreia navegações client-side do App Router.
// O primeiro render é ignorado — o pageview inicial já é enviado pelo
// gtag('config') no script de init. Só navegações subsequentes são rastreadas.
//
// Deve ser envolvido em <Suspense> no layout por causa do useSearchParams.

export default function RouteChangeTracker() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const isFirst      = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }

    const qs  = searchParams.toString()
    const url = pathname + (qs ? `?${qs}` : '')

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: url })
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [pathname, searchParams])

  return null
}
