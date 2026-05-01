'use client'

import Link from 'next/link'
import { CATEGORY_LABELS, ProductCategory } from '@/constants/products'

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

export default function FilterTabs({ activeCategory, currentParams }: FilterTabsProps) {
  const entries = Object.entries(CATEGORY_LABELS) as [ProductCategory, { label: string; emoji: string }][]

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-2.5">
        <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
          <Tab href={buildHref(null, currentParams)} active={!activeCategory} emoji="🎀" label="Todos" />
          {entries.map(([key, { label, emoji }]) => (
            <Tab
              key={key}
              href={buildHref(key, currentParams)}
              active={activeCategory === key}
              emoji={emoji}
              label={label}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Tab({ href, active, emoji, label }: { href: string; active: boolean; emoji: string; label: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      onClick={() => document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' })}
      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
        active
          ? 'bg-[#1E7439] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </Link>
  )
}
