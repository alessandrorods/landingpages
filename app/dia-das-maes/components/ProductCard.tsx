'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FaStar } from 'react-icons/fa'
import { Product, BADGE_CONFIG, CATEGORY_GRADIENT, CATEGORY_LABELS } from '@/constants/products'
import BuyButton from './BuyButton'
import ProductModal from './ProductModal'

function formatPrice(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function discountPct(original: number, current: number) {
  return Math.round((1 - current / original) * 100)
}

// ─── Regular card ─────────────────────────────────────────────────────────────

export default function ProductCard({ product }: { product: Product }) {
  const gradient = CATEGORY_GRADIENT[product.category] ?? 'from-gray-100 to-gray-200'
  const { emoji } = CATEGORY_LABELS[product.category] ?? { emoji: '🎁' }
  const lowStock = product.stockCount !== undefined && product.stockCount <= 10
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow h-full cursor-pointer">

        {/* Transparent overlay — makes the entire card tappable/clickable.
            z-10 sits above image and text; BuyButton wrapper is z-20 so it stays interactive. */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label={`Ver detalhes de ${product.name}`}
          className="absolute inset-0 z-10 rounded-2xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1E7439]"
        />

        {/* Image */}
        <div className={`relative bg-gradient-to-br ${gradient} aspect-square overflow-hidden`}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 25vw"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl select-none">
              {emoji}
            </div>
          )}

          {product.badges.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.badges.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight ${BADGE_CONFIG[badge].className}`}
                >
                  {BADGE_CONFIG[badge].label}
                </span>
              ))}
            </div>
          )}

          {lowStock && (
            <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white text-xs text-center py-1 font-semibold">
              ⚠️ Restam {product.stockCount} unidades
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          {/* <p className="text-[10px] text-gray-400 mb-0.5 font-mono">SKU: {product.sku}</p> */}
          <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 group-hover:text-[#1E7439] transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 mb-3 flex-1 leading-relaxed line-clamp-2">
            {product.shortDescription}
          </p>

          <div className="mb-3">
            {product.originalPrice && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  -{discountPct(product.originalPrice, product.price)}%
                </span>
              </div>
            )}
            <span className="text-xl font-extrabold text-gray-900">{formatPrice(product.price)}</span>
            {/* <span className="block text-[10px] text-gray-400 mt-0.5">ou 2× sem juros</span> */}
          </div>

          {/* z-20 keeps BuyButton above the card overlay */}
          <div className="relative z-20">
            <BuyButton
              sku={product.sku}
              name={product.name}
              price={product.price}
              category={product.category}
            />
          </div>
        </div>
      </div>

      {modalOpen && (
        <ProductModal product={product} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}

// ─── Highlight card ───────────────────────────────────────────────────────────

export function HighlightProductCard({ product }: { product: Product }) {
  const gradient = CATEGORY_GRADIENT[product.category] ?? 'from-gray-100 to-gray-200'
  const { emoji } = CATEGORY_LABELS[product.category] ?? { emoji: '🎁' }
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden shadow-md aspect-square group cursor-pointer">

        {/* Full-bleed image */}
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center text-8xl select-none`}>
            {emoji}
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

        {/* Full-card click — z-10 */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label={`Ver detalhes de ${product.name}`}
          className="absolute inset-0 z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
        />

        {/* Badges — top left */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
          <span className="bg-[#1E7439] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow inline-flex items-center gap-1">
            <FaStar className="text-yellow-300" /> Destaque
          </span>
          {product.badges.slice(0, 1).map((badge) => (
            <span key={badge} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${BADGE_CONFIG[badge].className}`}>
              {BADGE_CONFIG[badge].label}
            </span>
          ))}
        </div>

        {/* Overlaid content — bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-5 text-white">
          <h3 className="text-base sm:text-lg font-extrabold leading-snug mb-1 drop-shadow-sm">
            {product.name}
          </h3>

          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="flex items-baseline gap-2">
              {product.originalPrice && (
                <span className="text-xs text-white/60 line-through">{formatPrice(product.originalPrice)}</span>
              )}
              <span className="text-2xl font-extrabold drop-shadow-sm">{formatPrice(product.price)}</span>
            </div>
            {/* z-30 keeps BuyButton above the full-card overlay */}
            <div className="relative z-30 flex-shrink-0">
              <BuyButton
                sku={product.sku}
                name={product.name}
                price={product.price}
                category={product.category}
                variant="icon"
              />
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ProductModal product={product} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
