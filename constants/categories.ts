import type { ProductCategory } from './products.types'

export const CATEGORY_LABELS: Partial<Record<ProductCategory, { label: string; shortLabel: string; emoji: string; image: string; color: string; subtitle: string }>> = {
  flores:    { label: 'Flores do Campo', shortLabel: 'Flores do Campo', emoji: '🌹', image: '/categories/margarida.webp', color: '#b058d3', subtitle: 'Flores do campo para alegrar e emocionar no Dia das Mães' },
  girassois:   { label: 'Girassóis',       shortLabel: 'Girassóis',       emoji: '🌻', image: '/categories/girassol.webp',  color: '#cccf0c', subtitle: 'Girassóis para trazer alegria e iluminar o Dia das Mães' },
  'cafe-da-manha':    { label: 'Café da Manhã',   shortLabel: 'Café da Manhã',   emoji: '🥪', image: '/categories/cafe-manha.jpg', color: '#835623', subtitle: 'Cestas de Café da Manhã para um despertar especial' },
  chocolates: { label: 'Chocolates',       shortLabel: 'Chocolates',       emoji: '🍫', image: '/categories/chocolates.png',  color: '#7b4905', subtitle: 'Delícias para qualquer mamãe' },
  orquideas: { label: 'Orquídeas',       shortLabel: 'Orquídeas',       emoji: '🌷', image: '/categories/orquidea.webp',  color: '#7c3aed', subtitle: 'Elegância que dura meses — o presente inesquecível' },
}

export const CATEGORY_GRADIENT: Partial<Record<ProductCategory, string>> = {
  flores:    'from-rose-100 via-pink-100 to-rose-200',
  girassois:   'from-green-100 via-emerald-100 to-green-200',
  'cafe-da-manha':    'from-amber-100 via-yellow-100 to-amber-200',
  'chocolates':    'from-rose-100 via-yellow-100 to-blue-200',
  orquideas: 'from-purple-100 via-violet-100 to-purple-200'
}

export const FILTER_ALL = {
  label: 'Todos',
  emoji: '🎀',
  gradient: 'from-pink-100 via-rose-100 to-pink-200',
  color: '#a16a82',
  image: '',
} as const
