import { Product, ProductCategory, CATEGORY_LABELS } from '@/constants/products'
import ProductCard, { HighlightProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
  activeCategory: ProductCategory | null
}

export default function ProductGrid({ products, activeCategory }: ProductGridProps) {
  // ── Filtered by category ───────────────────────────────────────────────────
  if (activeCategory) {
    const highlight = products.find((p) => p.isHighlight)
    const regular = products.filter((p) => !p.isHighlight)

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {highlight && <HighlightProductCard product={highlight} />}
        {regular.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {regular.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── All categories: group by category with section headers ─────────────────
  const categories = Object.keys(CATEGORY_LABELS) as ProductCategory[]
  const grouped = categories
    .map((cat) => ({
      cat,
      highlight: products.find((p) => p.category === cat && p.isHighlight),
      regular: products.filter((p) => p.category === cat && !p.isHighlight),
    }))
    .filter((g) => g.highlight || g.regular.length > 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">

      {grouped.map(({ cat, highlight, regular }) => {
        const { label, emoji } = CATEGORY_LABELS[cat]
        return (
          <div key={cat} className="space-y-4">
            {/* Category header */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <h3 className="text-lg font-bold text-[#1E7439]">{label}</h3>
              <div className="flex-1 h-px bg-green-100" />
            </div>

            {/* Products: highlight spans 2 cols on the left, regular fill right */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {highlight && (
                <div className="col-span-2">
                  <HighlightProductCard product={highlight} />
                </div>
              )}
              {regular.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
