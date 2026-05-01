// ─── Helpers de dataLayer para Google Tag Manager ────────────────────────────
//
// Padrão GA4 Enhanced Ecommerce.
// No GTM, configure triggers com base nos "event" de cada push.
//
// Sugestão de triggers GTM:
//   • view_item_list → GA4 Event + Meta Pixel ViewContent
//   • add_to_cart    → GA4 Event + Meta Pixel AddToCart + Google Ads Conversion
//   • purchase       → GA4 Event + Meta Pixel Purchase + Google Ads Conversion
//   • filter_click   → GA4 Event
//   • cta_click      → GA4 Event

export interface GA4Item {
  item_id: string       // SKU do produto
  item_name: string     // Nome do produto
  item_category: string // Categoria (flores, plantas, cestas, presentes)
  price: number
  quantity?: number
}

function push(payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(payload)
}

/** Limpa o objeto ecommerce anterior antes de um novo push — requisito GA4. */
function clearEcommerce() {
  push({ ecommerce: null })
}

export function pushViewItemList(items: GA4Item[], listName = 'Dia das Mães LP') {
  clearEcommerce()
  push({
    event: 'view_item_list',
    ecommerce: {
      item_list_id: 'dia_das_maes_lp',
      item_list_name: listName,
      items: items.map((item) => ({ ...item, quantity: item.quantity ?? 1 })),
    },
  })
}

export function pushAddToCart(item: GA4Item) {
  clearEcommerce()
  push({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'BRL',
      value: item.price,
      items: [{ ...item, quantity: item.quantity ?? 1 }],
    },
  })
}

export interface GA4PurchaseData {
  transaction_id: string
  value: number
  items: GA4Item[]
}

export function pushPurchase(data: GA4PurchaseData) {
  clearEcommerce()
  push({
    event: 'purchase',
    ecommerce: {
      transaction_id: data.transaction_id,
      value: data.value,
      currency: 'BRL',
      items: data.items.map((item) => ({ ...item, quantity: item.quantity ?? 1 })),
    },
  })
}

export function pushFilterClick(category: string) {
  push({ event: 'filter_click', filter_category: category })
}

export function pushCtaClick(location: 'hero' | 'footer' | string) {
  push({ event: 'cta_click', cta_location: location })
}
