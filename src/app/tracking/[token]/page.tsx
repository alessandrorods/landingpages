import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MdOutlineShoppingBag } from 'react-icons/md'
import { FaHandHoldingHeart, FaStore, FaGoogle } from 'react-icons/fa6'
import { GoGift } from 'react-icons/go'
import { TbTruckDelivery } from 'react-icons/tb'
import { FiUserCheck } from 'react-icons/fi'
import { IoLogoWhatsapp } from 'react-icons/io5'
import { verifyTrackingToken } from '@/domains/orders/tracking-token'
import { getPublicOrderStatus } from '@/domains/orders/public-tracking'
import type { OrderStatus } from '@/domains/orders/order.types'

// ── Constants ────────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '5511972804138'
const GOOGLE_REVIEW_URL = 'https://g.page/r/CWuMAeiEbj42EBE/review?nr'
const BRAND_GREEN = '#1e7439'

// ── Step definitions ─────────────────────────────────────────────────────────

type StepState = 'done' | 'current' | 'upcoming'

interface StepDef {
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
}

const DELIVERY_STEPS: StepDef[] = [
  { label: 'Pedido recebido',     Icon: MdOutlineShoppingBag },
  { label: 'Em preparação',       Icon: FaHandHoldingHeart   },
  { label: 'Pronto para envio',   Icon: GoGift               },
  { label: 'A caminho',           Icon: TbTruckDelivery      },
  { label: 'Entregue',            Icon: FiUserCheck          },
]

const PICKUP_STEPS: StepDef[] = [
  { label: 'Pedido recebido',          Icon: MdOutlineShoppingBag },
  { label: 'Em preparação',            Icon: FaHandHoldingHeart   },
  { label: 'Disponível para retirada', Icon: FaStore              },
  { label: 'Retirado na loja',         Icon: FiUserCheck          },
]

const DELIVERY_INDEX: Partial<Record<OrderStatus, number>> = {
  pending: 0, approved: 0, preparing: 1, ready: 2, dispatched: 3, delivered: 4,
}

const PICKUP_INDEX: Partial<Record<OrderStatus, number>> = {
  pending: 0, approved: 0, preparing: 1, available_for_pickup: 2, delivered: 3,
}

function computeStates(status: OrderStatus, pickup: boolean): StepState[] {
  if (status === 'delivered') return (pickup ? PICKUP_STEPS : DELIVERY_STEPS).map(() => 'done')
  const idx = (pickup ? PICKUP_INDEX : DELIVERY_INDEX)[status] ?? 0
  return (pickup ? PICKUP_STEPS : DELIVERY_STEPS).map((_, i) =>
    i < idx ? 'done' : i === idx ? 'current' : 'upcoming',
  )
}

function fmtShortDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params
  const id = await verifyTrackingToken(token)
  return { title: id ? `Pedido #${id} — Mundo Planta` : 'Mundo Planta' }
}

export default async function TrackingPage({ params }: Props) {
  const { token } = await params

  const id = await verifyTrackingToken(token)
  if (!id) notFound()

  const data = await getPublicOrderStatus(id)
  if (!data) notFound()

  const { status, pickup, createdAt } = data
  const steps = pickup ? PICKUP_STEPS : DELIVERY_STEPS
  const states = computeStates(status, pickup)
  const isTerminalProblem = status === 'undelivered' || status === 'cancelled'
  const isDelivered = status === 'delivered'
  const showTimeline = !isTerminalProblem && !isDelivered

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header — logo + order number in brand green */}
      <header className="flex flex-col items-center px-6 pt-8 pb-7" style={{ backgroundColor: BRAND_GREEN }}>
        <Image
          src="/logo-mp.png"
          alt="Mundo Planta"
          width={148}
          height={66}
          className="object-contain"
          priority
        />
        <div className="mt-5 text-center">
          <p className="text-sm font-medium text-white/70 tracking-wide">Rastreamento de pedido</p>
          <p className="text-4xl font-bold font-mono text-white mt-1 tracking-tight">#{id}</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-6 pb-10 space-y-3">

        {/* Delivered */}
        {isDelivered && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-2">
              <p className="text-3xl">🎉</p>
              <p className="text-lg font-bold text-gray-900">
                {pickup ? 'Pedido retirado!' : 'Pedido entregue!'}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Obrigado pela sua compra. Esperamos que tenha adorado!
              </p>
            </div>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full text-white font-semibold py-4 rounded-xl text-base transition-colors"
              style={{ backgroundColor: '#4285F4' }}
            >
              <FaGoogle size={17} />
              Avaliar no Google
            </a>
          </>
        )}

        {/* Problem / Cancelled */}
        {isTerminalProblem && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-2">
              <p className="text-3xl">{status === 'cancelled' ? '✕' : '⚠️'}</p>
              <p className="text-lg font-bold text-gray-900">
                {status === 'cancelled' ? 'Pedido cancelado' : 'Problema na entrega'}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {status === 'cancelled'
                  ? 'Este pedido foi cancelado. Entre em contato se tiver dúvidas.'
                  : 'Tivemos um problema ao entregar seu pedido. Entre em contato conosco.'}
              </p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Preciso de ajuda com o meu pedido #${id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl text-base transition-colors"
            >
              <IoLogoWhatsapp size={20} />
              Falar com a loja
            </a>
          </>
        )}

        {/* Timeline */}
        {showTimeline && (
          <div className="ml-[22px] border-l-2 border-gray-200 space-y-7 py-2">
            {steps.map((step, i) => {
              const state = states[i]
              const { Icon } = step

              const circleStyle =
                state === 'current'
                  ? { backgroundColor: BRAND_GREEN, color: 'white', boxShadow: '0 2px 10px rgba(30,116,57,.4)' }
                  : {}

              return (
                <div key={step.label} className="-ml-[22px] flex items-center gap-4">
                  {/* Icon circle — center sits on the border line */}
                  <div
                    className={`flex-none w-11 h-11 rounded-full flex items-center justify-center
                      ${state === 'done'     ? 'bg-green-100 text-green-600' : ''}
                      ${state === 'upcoming' ? 'bg-gray-200 text-gray-400'   : ''}
                    `}
                    style={circleStyle}
                  >
                    {state === 'done'
                      ? <span className="text-sm font-bold">✓</span>
                      : <Icon size={17} />
                    }
                  </div>

                  {/* Text */}
                  <div>
                    <p
                      className={`text-base font-semibold leading-snug
                        ${state === 'done'     ? 'text-gray-700' : ''}
                        ${state === 'upcoming' ? 'text-gray-400' : ''}
                      `}
                      style={state === 'current' ? { color: BRAND_GREEN } : {}}
                    >
                      {step.label}
                    </p>
                    {i === 0 && (
                      <p className="text-sm text-gray-400 mt-0.5">{fmtShortDate(createdAt)}</p>
                    )}
                    {state === 'current' && i > 0 && (
                      <p className="text-sm font-medium mt-0.5" style={{ color: BRAND_GREEN }}>Em andamento</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* WhatsApp — always visible on active orders */}
        {!isDelivered && !isTerminalProblem && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Tenho uma dúvida sobre o meu pedido #${id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 rounded-xl text-base transition-colors"
          >
            <IoLogoWhatsapp size={18} className="text-green-500" />
            Falar com a loja
          </a>
        )}

      </div>

    </main>
  )
}
