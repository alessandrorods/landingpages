const ITEMS = [
  { icon: '🌺', title: 'Flores Selecionadas', desc: 'Frescas e perfumadas' },
  { icon: '🚚', title: 'Entrega Garantida',   desc: 'Até 10/05 na sua cidade' },
  { icon: '🔒', title: 'Pagamento Seguro',    desc: '100% protegido' },
  { icon: '💬', title: 'Atendimento',         desc: 'Seg a Dom · 8h–20h' },
]

export default function TrustBar() {
  return (
    <section className="bg-[#E8F5EC] border-y border-green-200 py-5 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ITEMS.map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-1">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs sm:text-sm font-bold text-[#1E7439]">{item.title}</span>
              <span className="text-xs text-gray-500">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
