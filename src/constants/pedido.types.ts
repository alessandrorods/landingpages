export interface DataEntrega {
  valor: string         // dd/mm/yyyy — enviado ao Tiny como data_prevista
  dia: number
  diaSemana: string     // "Sex", "Sáb"…
  destaque?: boolean
  labelDestaque?: string
}

export interface PeriodoEntrega {
  id: string
  label: string
  idOlist: string
}
