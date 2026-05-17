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
  olistFormaFrete: string      // description sent in pedido.forma_frete (e.g. "Manhã I (depois das 08h)")
  olistFormaFreteId: string    // numeric ID from Olist formas_frete (for future use)
  sortOrder: number
  deliveryLimitHour: string    // HH:MM — until when this period delivers
  cutoffTime: string           // HH:MM — until when this period is available for purchase
}
