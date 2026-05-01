// Tracking direto — sem GTM.
// gtag() e fbq() ficam disponíveis via scripts no layout antes do app iniciar.

export interface AnalyticsItem {
  item_id: string       // SKU
  item_name: string
  item_category: string
  price: number
  quantity?: number
}

export interface PurchaseData {
  transaction_id: string
  value: number
  items: AnalyticsItem[]
}

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag(...args)
}

function fbq(method: string, event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq(method, event, params)
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

export function trackViewItemList(items: AnalyticsItem[]) {
  gtag('event', 'view_item_list', {
    item_list_id: 'dia_das_maes_lp',
    item_list_name: 'Dia das Mães LP',
    items: items.map((i) => ({ ...i, quantity: i.quantity ?? 1 })),
  })
  fbq('track', 'ViewContent', {
    content_ids: items.map((i) => i.item_id),
    content_type: 'product',
    currency: 'BRL',
  })
}

export function trackAddToCart(item: AnalyticsItem) {
  gtag('event', 'add_to_cart', {
    currency: 'BRL',
    value: item.price,
    items: [{ ...item, quantity: item.quantity ?? 1 }],
  })
  fbq('track', 'AddToCart', {
    content_ids: [item.item_id],
    content_type: 'product',
    value: item.price,
    currency: 'BRL',
  })
}

export function trackPurchase(data: PurchaseData) {
  // GA4
  gtag('event', 'purchase', {
    transaction_id: data.transaction_id,
    value: data.value,
    currency: 'BRL',
    items: data.items.map((i) => ({ ...i, quantity: i.quantity ?? 1 })),
  })

  // Meta Pixel
  fbq('track', 'Purchase', {
    value: data.value,
    currency: 'BRL',
    content_ids: data.items.map((i) => i.item_id),
    content_type: 'product',
    num_items: data.items.length,
    order_id: data.transaction_id,
  })

  // Google Ads Conversion — "AW-XXXXXXXXX/YYYYYYY"
  const gadsConversion = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION
  if (gadsConversion) {
    gtag('event', 'conversion', {
      send_to: gadsConversion,
      value: data.value,
      currency: 'BRL',
      transaction_id: data.transaction_id,
    })
  }
}
