interface Window {
  dataLayer: Record<string, unknown>[]
  /** Meta Pixel — disponível se carregado via GTM ou snippet direto */
  fbq?: (method: string, event: string, params?: Record<string, unknown>) => void
  /** Google Ads gtag — disponível se o Global Site Tag for carregado diretamente */
  gtag?: (...args: unknown[]) => void
}
