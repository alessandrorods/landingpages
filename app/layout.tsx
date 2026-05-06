import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Suspense } from 'react'
import { headers } from 'next/headers'
import './globals.css'
import AnalyticsScripts from '@/app/components/AnalyticsScripts'
import RouteChangeTracker from '@/app/components/RouteChangeTracker'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mundoplanta.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Mundo Planta Flores e Presentes',
    template: '%s | Mundo Planta',
  },
  description: 'Flores frescas, plantas e presentes especiais com entrega garantida.',
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.png' },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const skipAnalytics = (await headers()).get('x-skip-analytics') === '1'

  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {!skipAnalytics && <AnalyticsScripts />}
        {!skipAnalytics && (
          <Suspense fallback={null}>
            <RouteChangeTracker />
          </Suspense>
        )}
        {children}
      </body>
    </html>
  )
}
