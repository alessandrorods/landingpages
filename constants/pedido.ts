export const CAMPANHA_ECOMMERCE = 'MAES-2026'
export const CAMPANHA_MARCADOR = 'Campanha-Maes2026'
export const FRETE_VALOR = 15.00
export const FRETE_POR_CONTA = 'D'

export type { DataEntrega, PeriodoEntrega } from './pedido.types'
import type { DataEntrega, PeriodoEntrega } from './pedido.types'

export const DATAS_ENTREGA: DataEntrega[] = [
  { valor: '29/04/2026', dia: 29,  diaSemana: 'Ontem' },
  { valor: '30/04/2026', dia: 30,  diaSemana: 'Hoje' },
  { valor: '06/05/2026', dia: 6,  diaSemana: 'Qua' },
  { valor: '07/05/2026', dia: 7,  diaSemana: 'Qui' },
  { valor: '08/05/2026', dia: 8,  diaSemana: 'Sex' },
  { valor: '09/05/2026', dia: 9,  diaSemana: 'Sáb' },
  { valor: '10/05/2026', dia: 10, diaSemana: 'Dom', destaque: true, labelDestaque: 'Dia das Mães' },
  { valor: '11/05/2026', dia: 11, diaSemana: 'Seg' },
]

export const PERIODOS_ENTREGA: PeriodoEntrega[] = [
  { id: 'qualquer', label: 'Qualquer horário (09h às 18h)', idOlist: "Horário Comercial (08h às 18h)" },
  { id: 'manha', label: 'Manhã (após 8h)', idOlist: 'Manhã I (depois das 08h)'  },
  { id: 'tarde', label: 'Tarde (após 14h)', idOlist: 'Tarde I (depois das 14h)' },
]
