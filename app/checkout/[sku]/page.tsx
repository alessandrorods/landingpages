import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PRODUCTS } from '@/constants/products'
import CheckoutForm from '../CheckoutForm'

export const metadata: Metadata = {
  title: 'Finalizar Pedido',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ sku: string }>
}) {
  const { sku } = await params
  if (!PRODUCTS.some(p => p.sku === sku)) notFound()

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-[#1E7439]">
        <div className="max-w-4xl mx-auto px-5 py-3 flex items-center justify-between">
        <img src="/logo-mp.png" alt="Mundo Planta" className="h-10 w-auto" />
          <span className="text-green-200 text-xs font-medium tracking-widest uppercase select-none">Finalizar pedido</span>
        </div>
      </header>
      <CheckoutForm sku={sku} />
    </main>
  )
}
