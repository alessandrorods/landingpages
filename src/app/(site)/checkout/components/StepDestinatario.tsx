import type { DestinatarioForm } from '../types'
import { maskPhone } from '../utils'
import { Field, inputCls } from './Field'

interface Props {
  destinatario: DestinatarioForm
  errors: Record<string, string>
  onChange: (k: keyof DestinatarioForm, v: string) => void
  onToggle: (paraOutraPessoa: boolean) => void
}

export function StepDestinatario({ destinatario, errors, onChange, onToggle }: Props) {
  const { paraOutraPessoa } = destinatario

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-800">Destinatário</h2>
        <p className="text-xs text-gray-400 mt-0.5">Quem vai receber o presente?</p>
      </div>

      {/* Toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`flex-1 py-2.5 transition-colors cursor-pointer ${
            paraOutraPessoa
              ? 'bg-[#F0F9F3] text-[#1E7439]'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          É um presente 🎁
        </button>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`flex-1 py-2.5 transition-colors cursor-pointer border-l border-gray-200 ${
            !paraOutraPessoa
              ? 'bg-[#F0F9F3] text-[#1E7439]'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Eu vou receber
        </button>
      </div>

      {paraOutraPessoa ? (
        <>
          <Field label="Nome completo" required error={errors.destNome}>
            <input
              type="text"
              placeholder="Nome de quem vai receber"
              value={destinatario.nome}
              onChange={e => onChange('nome', e.target.value)}
              className={inputCls(!!errors.destNome)}
            />
          </Field>

          <Field
            label="Telefone"
            required
            hint="Usado para contato na hora da entrega"
            error={errors.destTelefone}
          >
            <input
              type="tel"
              inputMode="numeric"
              placeholder="(11) 99999-9999"
              value={destinatario.telefone}
              onChange={e => onChange('telefone', maskPhone(e.target.value))}
              className={inputCls(!!errors.destTelefone)}
            />
          </Field>
        </>
      ) : (
        <div className="rounded-xl bg-[#F0F9F3] border border-green-100 px-4 py-3 text-sm text-gray-600">
          Vamos usar seu nome e telefone como dados de entrega.
        </div>
      )}

    </div>
  )
}
