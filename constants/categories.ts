import type { ProductCategory } from './products.types'

export const CATEGORY_LABELS: Partial<Record<ProductCategory, { label: string; shortLabel: string; emoji: string; image: string; color: string }>> = {
  flores:    { label: 'Flores do Campo', shortLabel: 'Flores do Campo', emoji: '🌹', image: '/categories/margarida.webp', color: '#b058d3' },
  plantas:   { label: 'Girassóis', shortLabel: 'Girassóis', emoji: '🌿', image: '/categories/girassol.webp', color: '#cccf0c' },
  cestas:    { label: 'Café da Manhã', shortLabel: 'Café da Manhã', emoji: '🎁', image: '/categories/cafe-manha.jpg', color: '#835623' },
  orquideas: { label: 'Orquídeas', shortLabel: 'Orquídeas', emoji: '✨', image: '/categories/orquidea.webp', color: '#7c3aed' },
}

export const CATEGORY_GRADIENT: Partial<Record<ProductCategory, string>> = {
  flores:    'from-rose-100 via-pink-100 to-rose-200',
  plantas:   'from-green-100 via-emerald-100 to-green-200',
  cestas:    'from-amber-100 via-yellow-100 to-amber-200',
  orquideas: 'from-purple-100 via-violet-100 to-purple-200'
}

export const FILTER_ALL = {
  label: 'Todos',
  emoji: '🎀',
  gradient: 'from-pink-100 via-rose-100 to-pink-200',
  color: '#a16a82',
  image: '',
} as const
