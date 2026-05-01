export default function FooterCTA() {
  const mothersDay = new Date('2026-05-10T03:00:00Z')
  const diffTime = mothersDay.getTime() - Date.now()
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  const urgency =
    diffDays > 1
      ? `Faltam apenas ${diffDays} dias para o Dia das Mães.`
      : diffDays === 1
        ? 'Falta apenas 1 dia! Peça agora e garanta a entrega.'
        : 'Hoje é o Dia das Mães! Entrega expressa disponível.'

  return (
    <section className="bg-[#1E7439] text-white py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-pink-300 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4">
          ⏰ Últimos dias · garanta a entrega
        </p>

        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
          Não deixe para a última hora! 🌸
        </h2>

        <p className="text-green-100 text-base sm:text-lg mb-2">{urgency}</p>
        <p className="text-green-200 text-sm sm:text-base mb-8">
          Garanta a entrega e surpreenda quem fez tudo por você.
        </p>

        <a
          href="#produtos"
          className="inline-flex items-center justify-center bg-white text-[#1E7439] font-extrabold text-base sm:text-lg px-10 py-4 rounded-full shadow-xl hover:bg-green-50 active:scale-95 transition-all"
        >
          🌺 Escolher Meu Presente
        </a>

        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-green-200">
          <span>🔒 Pagamento Seguro</span>
          <span>🚚 Entrega Garantida</span>
          <span>🌺 Flores Frescas</span>
          <span>⭐ +5.000 clientes</span>
        </div>
      </div>
    </section>
  )
}
