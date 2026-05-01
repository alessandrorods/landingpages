'use client'

import Link from 'next/link'
import { trackAddToCart } from '@/lib/analytics'
import type { ProductCategory } from '@/constants/products'

interface BuyButtonProps {
  sku: string
  name: string
  price: number
  category: ProductCategory
  variant?: 'default' | 'large' | 'icon'
}

export default function BuyButton({ sku, name, price, category, variant = 'default' }: BuyButtonProps) {
  function handleClick() {
    trackAddToCart({ item_id: sku, item_name: name, item_category: category, price })
  }

  const cls =
    variant === 'large'
      ? 'block w-full bg-[#1E7439] hover:bg-[#155C2C] active:scale-95 text-white font-bold px-6 py-4 rounded-xl transition-all text-base text-center cursor-pointer'
      : variant === 'icon'
        ? 'flex items-center justify-center w-11 h-11 rounded-full bg-white/25 hover:bg-white/40 active:scale-95 backdrop-blur-sm border border-white/40 text-white text-xl transition-all cursor-pointer'
        : 'block w-full bg-[#1E7439] hover:bg-[#155C2C] active:scale-95 text-white font-bold px-4 py-3 rounded-xl transition-all text-sm text-center cursor-pointer'

  return (
    <Link href={`/checkout/${sku}`} onClick={handleClick} className={cls} aria-label="Comprar agora">
      {variant === 'large' ? '🛒 Comprar Agora' : variant === 'icon' ? '🛒' : 'Comprar Agora'}
    </Link>
  )
}
