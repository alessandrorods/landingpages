export default function UrgencyBanner() {
  const mothersDay = new Date('2026-05-10T03:00:00Z')
  const diffTime = mothersDay.getTime() - Date.now()
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  const message =
    diffDays > 1
      ? `Faltam ${diffDays} dias — garanta a entrega no Dia das Mães`
      : diffDays === 1
        ? 'É amanhã! Peça agora e garanta a entrega no Dia das Mães'
        : 'Hoje é o Dia das Mães! Entrega expressa disponível.'

  return (
    <div className="bg-[#155C2C] text-green-100 py-2 px-4 text-center text-xs font-medium tracking-wide">
      ⏰ {message} · <strong className="text-white">10/05</strong>
    </div>
  )
}
