export default function HeroSection() {
  const mothersDay = new Date('2026-05-10T03:00:00Z')
  const diffDays = Math.max(0, Math.ceil((mothersDay.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const [urgLine1, urgLine2] =
    diffDays > 1
      ? [`⏰ Faltam ${diffDays} dias`, 'Garanta a entrega no Dia das Mães']
      : diffDays === 1
        ? ['⏰ É amanhã!', 'Peça agora e garanta a entrega']
        : ['⏰ Hoje é o Dia das Mães!', 'Entrega expressa disponível']

  return (
    <section className="bg-gradient-to-br from-[#6B3F7A] to-[#B05878] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-14 text-center">

        <div className="inline-flex flex-col items-center bg-white/10 border border-white/20 px-5 py-2.5 rounded-2xl mb-5 gap-0.5">
          <span className="text-pink-100 text-sm font-bold uppercase tracking-widest">{urgLine1}</span>
          <span className="text-pink-300/80 text-xs font-medium">{urgLine2}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          Para a mãe que faz<br />
          <span className="text-pink-200">tudo florescer</span>
        </h1>

        <p className="text-base sm:text-lg text-purple-100 max-w-lg mx-auto mb-7 leading-relaxed">
          Flores frescas, plantas especiais e presentes únicos com{' '}
          <strong className="text-white">entrega garantida</strong> até o Dia das Mães.
        </p>

        <a
          href="#produtos"
          className="inline-flex items-center justify-center bg-white text-[#6B3F7A] font-bold text-base px-8 py-3.5 rounded-full shadow-lg hover:bg-purple-50 transition-colors"
        >
          🌺 Ver Presentes
        </a>
      </div>
    </section>
  )
}
