'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Product, BADGE_CONFIG, CATEGORY_GRADIENT, CATEGORY_LABELS } from '@/constants/products'
import { trackViewItem } from '@/lib/analytics'
import BuyButton from './BuyButton'

function formatPrice(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function discountPct(original: number, current: number) {
  return Math.round((1 - current / original) * 100)
}

interface ProductModalProps {
  product: Product
  onClose: () => void
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const gradient = CATEGORY_GRADIENT[product.category] ?? 'from-gray-100 to-gray-200'
  const { emoji, label } = CATEGORY_LABELS[product.category] ?? { emoji: '🎁', label: product.category }
  const lowStock = product.stockCount !== undefined && product.stockCount <= 10

  const allImages = [product.image, ...(product.images ?? [])].filter(Boolean)
  const [activeImg, setActiveImg] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Push history entry so the back button closes the modal instead of leaving the page
  useEffect(() => {
    window.history.pushState({ modal: product.sku }, '')
    const onPopState = () => onClose()
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [product.sku, onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') window.history.back() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { dialogRef.current?.focus() }, [])

  useEffect(() => {
    trackViewItem({ item_id: product.sku, item_name: product.name, item_category: product.category, price: product.price })
  }, [product.sku, product.name, product.category, product.price])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-modal-backdrop"
        onClick={() => window.history.back()}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-product-name"
        tabIndex={-1}
        className={[
          'relative bg-white w-full sm:max-w-2xl',
          'rounded-t-3xl sm:rounded-2xl',
          'max-h-[93dvh] sm:max-h-[88vh]',
          'flex flex-col overflow-hidden outline-none shadow-2xl',
          'animate-modal-slide-up sm:animate-modal-scale-in',
        ].join(' ')}
      >
        {/* Close button */}
        <button
          onClick={() => window.history.back()}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-20 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full w-9 h-9 flex items-center justify-center shadow-md transition-colors text-lg leading-none"
        >
          ✕
        </button>

        {/* ── Scrollable content ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Mobile drag handle */}
          <div className="sm:hidden sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-white/95 backdrop-blur-sm">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="flex flex-col sm:flex-row">
            {/* ── Image gallery ─────────────────────────────────── */}
            <div className="sm:w-[45%] flex-shrink-0 flex flex-col">
              <div className={`relative bg-gradient-to-br ${gradient} aspect-square`}>
                {allImages.length > 0 ? (
                  <Image
                    src={allImages[activeImg]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 45vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-8xl select-none">
                    {emoji}
                  </div>
                )}

                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.badges.slice(0, 2).map((badge) => (
                    <span
                      key={badge}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${BADGE_CONFIG[badge].className}`}
                    >
                      {BADGE_CONFIG[badge].label}
                    </span>
                  ))}
                </div>
              </div>

              {allImages.length > 1 && (
                <div className="flex gap-2 px-3 py-2.5 overflow-x-auto">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      aria-label={`Foto ${i + 1}`}
                      className={[
                        'relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all',
                        activeImg === i
                          ? 'border-[#1E7439] shadow-md opacity-100'
                          : 'border-gray-200 opacity-50 hover:opacity-80',
                      ].join(' ')}
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Product details ───────────────────────────────── */}
            <div className="flex flex-col p-5 sm:p-6 flex-1 min-w-0">
              <p className="text-xs text-[#1E7439] font-semibold uppercase tracking-wider mb-1.5">
                {emoji} {label}
              </p>

              <h2
                id="modal-product-name"
                className="text-xl font-extrabold text-gray-900 leading-snug mb-3"
              >
                {product.name}
              </h2>

              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {product.description ?? product.shortDescription}
              </p>

              {lowStock && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold px-3 py-2.5 rounded-xl mb-4">
                  <span>⚠️</span>
                  <span>Apenas {product.stockCount} unidades disponíveis — garanta o seu!</span>
                </div>
              )}

              <div className="mt-auto grid grid-cols-3 gap-1 text-center pt-4">
                {[
                  { icon: '🔒', text: 'Pagamento seguro' },
                  { icon: '🚚', text: 'Entrega garantida' },
                  { icon: '⭐', text: 'Satisfação garantida' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex flex-col items-center gap-1 py-2 rounded-xl bg-gray-50">
                    <span className="text-base">{icon}</span>
                    <span className="text-[10px] text-gray-500 leading-tight font-medium">{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => window.history.back()}
                className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors self-center"
              >
                Continuar vendo os produtos
              </button>
            </div>
          </div>
        </div>

        {/* ── Sticky footer — always visible ───────────────────────── */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              {product.originalPrice && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    -{discountPct(product.originalPrice, product.price)}%
                  </span>
                </div>
              )}
              <div className="text-xl font-extrabold text-gray-900 leading-none">
                {formatPrice(product.price)}
              </div>
            </div>
            <div className="flex-1">
              <BuyButton
                sku={product.sku}
                name={product.name}
                price={product.price}
                category={product.category}
                variant="large"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
