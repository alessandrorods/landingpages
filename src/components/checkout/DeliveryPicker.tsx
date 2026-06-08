'use client'

import { DATAS_ENTREGA } from '@/constants/pedido'
import type { DataEntrega } from '@/constants/pedido'
import { useDeliveryPeriods } from '@/hooks/useDeliveryPeriods'
import { isPeriodAvailable } from '@/domains/checkout/periods'

function filterDates(hasAvailablePeriodsToday: boolean): DataEntrega[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return DATAS_ENTREGA.filter(d => {
    const [dd, mm, yyyy] = d.valor.split('/').map(Number)
    const date = new Date(yyyy, mm - 1, dd)
    if (date < todayStart) return false
    if (date.getTime() === todayStart.getTime() && !hasAvailablePeriodsToday) return false
    return true
  })
}

interface Props {
  dataEntrega: string
  periodoEntrega: string
  onData: (valor: string) => void
  onPeriodo: (id: string) => void
  errorData?: string
  errorPeriodo?: string
}

export function DeliveryPicker({ dataEntrega, periodoEntrega, onData, onPeriodo, errorData, errorPeriodo }: Props) {
  const { periods, preparationTimeMinutes } = useDeliveryPeriods()
  const availablePeriods = periods.filter(p => isPeriodAvailable(p, preparationTimeMinutes))
  const availableDates = filterDates(availablePeriods.length > 0)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Data de entrega <span className="text-rose-500">*</span>
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {availableDates.map(d => {
            const selected = dataEntrega === d.valor
            return (
              <button
                key={d.valor}
                type="button"
                onClick={() => onData(d.valor)}
                className={`shrink-0 w-[58px] rounded-xl border-2 pt-2.5 pb-2 flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  selected
                    ? 'border-[#1E7439] bg-[#1E7439] text-white'
                    : d.destaque
                      ? 'border-amber-400 bg-amber-50 text-gray-800 hover:bg-amber-100'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-base font-extrabold leading-none">{d.dia}</span>
                <span className="text-[11px] font-medium leading-none mt-1">{d.diaSemana}</span>
                {d.destaque && (
                  <span className={`text-[9px] font-bold leading-tight mt-1 text-center px-0.5 ${selected ? 'text-amber-200' : 'text-amber-600'}`}>
                    {d.labelDestaque}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {errorData && <p className="text-rose-500 text-xs mt-1">{errorData}</p>}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Período de entrega <span className="text-rose-500">*</span>
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {availablePeriods.map(p => {
            const selected = periodoEntrega === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPeriodo(p.id)}
                className={`shrink-0 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selected
                    ? 'border-[#1E7439] bg-[#1E7439] text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        {errorPeriodo && <p className="text-rose-500 text-xs mt-1">{errorPeriodo}</p>}
      </div>
    </div>
  )
}
