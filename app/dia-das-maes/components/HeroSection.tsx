export default function HeroSection() {
  const mothersDay = new Date('2026-05-10T03:00:00Z')
  const diffDays = Math.max(0, Math.ceil((mothersDay.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const [urgLine1, urgLine2] =
    diffDays > 1
      ? [`⏰ Faltam ${diffDays} dias`, 'Antecipe seu pedido e garanta a entrega']
      : diffDays === 1
        ? ['⏰ É amanhã!', 'Último dia para agendar — garanta a entrega']
        : ['⏰ Hoje é o Dia das Mães!', 'Entrega expressa disponível agora']

  return (
    <section className="bg-gradient-to-br from-[#6B3F7A] to-[#B05878] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-14 text-center">

        {/* Urgência */}
        <div className="inline-flex flex-col items-center mb-5 gap-0.5">
          <span className="text-amber-500 text-sm font-bold uppercase tracking-widest">{urgLine1}</span>
          <span className="text-amber-400/70 text-xs font-medium">{urgLine2}</span>
        </div>

        {/* Título */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-1 uppercase">
          <small className="text-[55%] font-light text-pink-300 tracking-widest not-italic">Especial</small>
          <br />
          Dia das Mães
        </h1>

        {/* Localidade */}
        <p className="text-pink-300 text-sm sm:text-base font-semibold tracking-wide mb-4">
          📍 Floricultura em Mogi das Cruzes
        </p>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg text-pink-100 max-w-md mx-auto mb-8 leading-relaxed">
          Entrega garantida no{' '}
          <strong className="text-white">domingo, 10 de Maio</strong>
          {' '}— agende seu pedido com antecedência e surpreenda quem você ama.
        </p>

        {/* CTA — único elemento com forma de botão */}
        <a
          href="#produtos"
          className="inline-flex items-center justify-center gap-2 bg-white text-[#6B3F7A] font-bold text-base sm:text-lg px-10 py-4 rounded-full shadow-xl hover:bg-purple-50 transition-colors"
        >
          🌺 Agendar meu presente
        </a>

        {/* Trust — linha de texto com separadores, sem pill */}
        <p className="mt-5 text-[11px] sm:text-xs text-pink-300/80 tracking-wide">
          📍 Mogi das Cruzes &nbsp;·&nbsp; 📅 Entrega Dom. 10/05 &nbsp;·&nbsp; ⚡ Antecipe seu pedido
        </p>

      </div>
    </section>
  )
}
