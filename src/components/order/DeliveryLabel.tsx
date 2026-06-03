const spFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function spDate(offset = 0): string {
  return spFmt.format(new Date(Date.now() + offset * 86_400_000))
}

export function DeliveryLabel({ data }: { data?: string }) {
  if (!data) return null

  if (data === spDate(0)) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500 text-white whitespace-nowrap">
        para Hoje
      </span>
    )
  }

  if (data === spDate(1)) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-white whitespace-nowrap">
        para Amanhã
      </span>
    )
  }

  return <span className="text-xs text-gray-400 whitespace-nowrap">{data}</span>
}
