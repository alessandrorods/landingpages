import type { Metadata } from 'next'
import { PRODUCTS, CATEGORY_LABELS, ProductCategory } from '@/constants/products'
import HeroSection from './components/HeroSection'
import TrustBar from './components/TrustBar'
import FilterTabs from './components/FilterTabs'
import ProductGrid from './components/ProductGrid'
import FooterCTA from './components/FooterCTA'
import JsonLd from './components/JsonLd'
import PageViewEvents from './components/PageViewEvents'
import type { AnalyticsItem } from '@/lib/analytics'

// ─── Metadata ─────────────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://floramundoplanta.com.br'
const PAGE_URL = `${SITE_URL}/dia-das-maes`
const OG_IMAGE = `${SITE_URL}/og/dia-das-maes.jpg`

export const metadata: Metadata = {
  title: 'Especial Dia das Mães 2026 - Mundo Planta Flores e Presentes',
  description:
    'Surpreenda sua mãe com flores frescas, plantas especiais e presentes únicos. Entrega garantida até 10/05. Compre agora!',
  keywords: [
    'dia das mães',
    'flores dia das mães',
    'buquê dia das mães',
    'presente dia das mães',
    'orquídea presente',
    'cesta dia das mães',
    'plantas ornamentais',
    'floricultura em mogi das cruzes',
    'entrega flores',
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'Especial Dia das Mães - Mundo Planta Flores e Presentes',
    description:
      'Flores frescas e presentes com entrega garantida para o Dia das Mães. Surpreenda quem você ama! 🌸',
    url: PAGE_URL,
    siteName: 'Mundo Planta Flores e Presentes',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Especial Dia das Mães 2026 - Mundo Planta Flores e Presentes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Especial Dia das Mães 2026 | Mundo Planta',
    description: 'Flores frescas e presentes com entrega garantida. Surpreenda sua mãe! 🌸',
    images: [OG_IMAGE],
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[]

export default async function DiaDasMaesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const params = await searchParams
  const tipo = typeof params.tipo === 'string' ? params.tipo : undefined

  const activeCategory: ProductCategory | null = VALID_CATEGORIES.includes(tipo as ProductCategory)
    ? (tipo as ProductCategory)
    : null

  const filteredProducts = activeCategory
    ? PRODUCTS.filter((p) => p.category === activeCategory)
    : PRODUCTS

  const ga4Items: AnalyticsItem[] = filteredProducts.map((p) => ({
    item_id: p.sku,
    item_name: p.name,
    item_category: p.category,
    price: p.price,
  }))

  return (
    <main className="min-h-screen bg-white">
      {/* JSON-LD — renderizado no <head> via position no DOM do server component */}
      <JsonLd products={filteredProducts} />

      {/* Dispara view_item_list assim que o cliente monta */}
      <PageViewEvents items={ga4Items} />

      <header className="sticky top-0 z-50 bg-[#1E7439] shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <img src="/logo-mp.png" alt="Mundo Planta" className="h-10 w-auto" />
          <span className="text-green-200 text-xs font-medium tracking-widest uppercase select-none">Especial Dia das Mães</span>
        </div>
      </header>

      <HeroSection />

      <section id="produtos" className="scroll-mt-16">
        <div className="sticky top-16 z-40 shadow-sm">
          <FilterTabs activeCategory={activeCategory} currentParams={params} />
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">
            Escolha o presente perfeito 🌸
          </h2>
          <p className="text-gray-400 text-sm">
            A partir de <strong className="text-gray-600">R$ 59,90</strong> · entrega garantida até 10 de Maio
          </p>
        </div>

        <ProductGrid products={filteredProducts} activeCategory={activeCategory} />
      </section>

      <TrustBar />
      <FooterCTA />
    </main>
  )
}
