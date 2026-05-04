'use client'

import { useRef } from 'react'
import { FaChevronLeft, FaChevronRight, FaTrophy } from 'react-icons/fa'
import { PRODUCTS } from '@/constants/products'
import { HorizontalProductCard } from './ProductCard'

const BEST_SELLERS = PRODUCTS.filter(p => p.badges.includes('mais-vendido') && p.inStock)

const CARD_W = 288 // matches w-72 (18rem)

export default function BestSellersSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (BEST_SELLERS.length === 0) return null

  const scroll = (dir: 'prev' | 'next') => {
    scrollRef.current?.scrollBy({
      left: dir === 'next' ? CARD_W + 16 : -(CARD_W + 16),
      behavior: 'smooth',
    })
  }

  return (
    <section className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-t-4 border-amber-400 py-8 sm:py-12 overflow-hidden">

      {/* Decorative blobs */}
      <div className="absolute -top-12 -right-12 w-56 h-56 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm mb-2">
              <FaTrophy className="text-yellow-200" />
              Mais Vendidos
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              Os queridinhos da temporada
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Escolhas certeiras que toda mãe vai amar ❤️
            </p>
          </div>

          {/* Nav — desktop */}
          <div className="hidden sm:flex gap-2 flex-shrink-0">
            <button
              onClick={() => scroll('prev')}
              aria-label="Ver anterior"
              className="w-10 h-10 rounded-full border-2 border-amber-300 bg-white hover:bg-amber-50 flex items-center justify-center text-amber-600 transition-colors shadow-sm"
            >
              <FaChevronLeft size={14} />
            </button>
            <button
              onClick={() => scroll('next')}
              aria-label="Ver próximo"
              className="w-10 h-10 rounded-full border-2 border-amber-300 bg-white hover:bg-amber-50 flex items-center justify-center text-amber-600 transition-colors shadow-sm"
            >
              <FaChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 no-scrollbar"
        >
          {BEST_SELLERS.map((product) => (
            <div
              key={product.id}
              className="snap-start flex-shrink-0 w-72"
            >
              <HorizontalProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Mobile swipe hint */}
        <p className="sm:hidden text-center text-xs text-amber-500/70 mt-3 select-none">
          ← deslize para ver mais →
        </p>

        {/* CTA link */}
        <div className="text-center mt-5">
          <a
            href="#produtos"
            className="inline-flex items-center gap-1.5 text-amber-700 font-semibold text-sm hover:text-amber-900 transition-colors"
          >
            Ver todos os produtos
            <FaChevronRight size={10} />
          </a>
        </div>
      </div>
    </section>
  )
}
