import { Product, ProductCategory, CATEGORY_LABELS } from '@/constants/products'
import ProductCard, { HighlightProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
  activeCategory: ProductCategory | null
}

function ProductSection({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
      {products.map((p) =>
        p.isHighlight ? (
          <div key={p.id} className="col-span-2">
            <HighlightProductCard product={p} />
          </div>
        ) : (
          <ProductCard key={p.id} product={p} />
        )
      )}
    </div>
  )
}

export default function ProductGrid({ products, activeCategory }: ProductGridProps) {
  if (activeCategory) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <ProductSection products={products} />
      </div>
    )
  }

  const categories = Object.keys(CATEGORY_LABELS) as ProductCategory[]
  const grouped = categories
    .map((cat) => ({ cat, items: products.filter((p) => p.category === cat) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {grouped.map(({ cat, items }) => {
        const { label, emoji } = CATEGORY_LABELS[cat]!
        return (
          <div key={cat} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <h3 className="text-lg font-bold text-[#1E7439]">{label}</h3>
              <div className="flex-1 h-px bg-green-100" />
            </div>
            <ProductSection products={items} />
          </div>
        )
      })}
    </div>
  )
}
