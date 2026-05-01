'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CATEGORY_LABELS, FILTER_ALL, ProductCategory } from '@/constants/products'

interface FilterTabsProps {
  activeCategory: ProductCategory | null
  currentParams: Record<string, string | string[]>
}

function buildHref(
  tipo: string | null,
  currentParams: Record<string, string | string[]>,
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(currentParams)) {
    if (key === 'tipo') continue
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
    else params.set(key, value)
  }
  if (tipo) params.set('tipo', tipo)
  const qs = params.toString()
  return `/dia-das-maes${qs ? `?${qs}` : ''}`
}

// Must match `top-16` on the sticky wrapper in page.tsx
const STICKY_TOP = 64

export default function FilterTabs({ activeCategory, currentParams }: FilterTabsProps) {
  const [stuck, setStuck] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => setStuck(el.getBoundingClientRect().top <= STICKY_TOP + 1)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const entries = (Object.entries(CATEGORY_LABELS) as [ProductCategory, typeof CATEGORY_LABELS[ProductCategory]][])
    .filter((e): e is [ProductCategory, NonNullable<typeof CATEGORY_LABELS[ProductCategory]>] => e[1] != null)
  const scrollToProducts = () => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div ref={containerRef} className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
        {/* w-max + mx-auto: centraliza quando cabe na tela; scroll correto quando transborda */}
        <div
          className="flex w-max mx-auto transition-all duration-300"
          style={{
            gap: stuck ? '0.5rem' : '1rem',
            paddingTop: stuck ? '0.625rem' : '1.25rem',
            paddingBottom: stuck ? '0.625rem' : '1.25rem',
          }}
        >
          <Tab
            href={buildHref(null, currentParams)}
            active={!activeCategory}
            label={FILTER_ALL.label}
            color={FILTER_ALL.color}
            image={FILTER_ALL.image}
            stuck={stuck}
            onClick={scrollToProducts}
          />
          {entries.map(([key, { shortLabel, image, color }]) => (
            <Tab
              key={key}
              href={buildHref(key, currentParams)}
              active={activeCategory === key}
              label={shortLabel}
              color={color}
              image={image}
              stuck={stuck}
              onClick={scrollToProducts}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Tab({
  href,
  active,
  label,
  color,
  image,
  stuck,
  onClick,
}: {
  href: string
  active: boolean
  label: string
  color: string
  image: string
  stuck: boolean
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      scroll={false}
      onClick={onClick}
      className="flex-shrink-0 relative rounded-full transition-all duration-300"
      style={{
        height: stuck ? '2rem' : '5rem',
        // minWidth = maxWidth em ambos os estados: valores explícitos são animáveis;
        // 'auto' não é — por isso conteúdo absoluto colapsava com minWidth: 0
        minWidth: stuck ? '10.5rem' : '5rem',
        maxWidth: stuck ? '10.5rem' : '5rem',
        boxShadow: !stuck && active
          ? `0 0 0 2.5px #fff, 0 0 0 5px ${color}`
          : stuck && !active
            ? `inset 0 0 0 1px ${color}50`
            : 'none',
      }}
    >
      {/* Background: cor sólida + imagem full-bleed (só no círculo) */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: stuck ? (active ? color : `${color}15`) : color }}
      >
        {image && (
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: stuck ? 0 : 1,
            }}
          />
        )}
        {/* Camada de cor entre imagem e texto — cobre o círculo inteiro */}
        {image && (
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              backgroundColor: color,
              opacity: stuck ? 0 : (active ? 0.6 : 0.35),
            }}
          />
        )}
      </div>

      {/* Conteúdo: thumbnail + label */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{
          gap: stuck ? '0.5rem' : '0',
          paddingInline: stuck ? '0.75rem' : '0',
        }}
      >
        {image && (
          <img
            src={image}
            alt=""
            className="rounded-full object-cover flex-shrink-0 transition-all duration-300"
            style={{
              width: stuck ? '1rem' : '0',
              height: stuck ? '1rem' : '0',
              opacity: stuck ? 1 : 0,
            }}
          />
        )}
        <span
          className={`font-bold text-center leading-tight transition-all duration-300 ${stuck ? 'whitespace-nowrap' : 'whitespace-normal'}`}
          style={{
            fontSize: stuck ? '0.875rem' : '0.6875rem',
            color: stuck ? (active ? '#fff' : color) : '#fff',
          }}
        >
          {label}
        </span>
      </div>
    </Link>
  )
}
