interface Props {
  comMensagem: boolean
  mensagemCartao: string
  onToggle: (v: boolean) => void
  onChange: (v: string) => void
}

export function CardMensagem({ comMensagem, mensagemCartao, onToggle, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-800">Mensagem no cartão</h2>
        <p className="text-xs text-gray-400 mt-0.5">Será impressa no cartão que acompanha o presente</p>
      </div>

      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`flex-1 py-2.5 transition-colors cursor-pointer ${
            comMensagem
              ? 'bg-[#F0F9F3] text-[#1E7439]'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Quero adicionar ✍️
        </button>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`flex-1 py-2.5 transition-colors cursor-pointer border-l border-gray-200 ${
            !comMensagem
              ? 'bg-[#F0F9F3] text-[#1E7439]'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Sem mensagem
        </button>
      </div>

      {comMensagem && (
        <div>
          <textarea
            placeholder="Ex: Feliz Dia das Mães! Te amo muito. ❤️"
            value={mensagemCartao}
            onChange={e => onChange(e.target.value.slice(0, 200))}
            rows={4}
            className="w-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200 focus:border-[#1E7439] transition-colors resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-0.5">{mensagemCartao.length}/200</p>
        </div>
      )}
    </div>
  )
}
