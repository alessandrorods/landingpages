const STEP_LABELS = ['Endereço', 'Destinatário', 'Comprador', 'Resumo']

export function StepIndicator({ current, onNavigate }: { current: number; onNavigate: (step: number) => void }) {
  return (
    <nav className="flex items-start w-full" aria-label="Etapas do pedido">
      {STEP_LABELS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className={`flex items-center min-w-0 ${i < STEP_LABELS.length - 1 ? 'flex-1' : 'flex-shrink-0'}`}>
            <div
              className={`flex flex-col items-center flex-shrink-0 ${done ? 'cursor-pointer' : ''}`}
              onClick={() => done && onNavigate(i)}
              role={done ? 'button' : undefined}
              aria-label={done ? `Voltar para ${label}` : undefined}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done
                    ? 'bg-[#1E7439] text-white hover:bg-[#155C2C]'
                    : active
                      ? 'bg-[#1E7439] text-white ring-4 ring-green-100'
                      : 'bg-gray-100 text-gray-400'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium text-center leading-tight ${
                  active ? 'text-[#1E7439]' : done ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 mb-4 transition-colors ${done ? 'bg-[#1E7439]' : 'bg-gray-200'}`}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
