import type { CompradorForm } from '../types'
import { maskPhone } from '../utils'
import { Field, inputCls } from './Field'

interface Props {
  comprador: CompradorForm
  errors: Record<string, string>
  onChange: (k: keyof CompradorForm, v: string) => void
}

export function StepComprador({ comprador, errors, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-800">Seus dados</h2>
        <p className="text-xs text-gray-400 mt-0.5">Quem está fazendo o pedido</p>
      </div>

      <Field label="Seu nome completo" required error={errors.comprNome}>
        <input
          type="text"
          placeholder="Seu nome"
          value={comprador.nome}
          onChange={e => onChange('nome', e.target.value)}
          className={inputCls(!!errors.comprNome)}
        />
      </Field>

      <Field
        label="Seu telefone"
        required
        hint="Para te atualizarmos sobre o pedido"
        error={errors.comprTelefone}
      >
        <input
          type="tel"
          inputMode="numeric"
          placeholder="(11) 99999-9999"
          value={comprador.telefone}
          onChange={e => onChange('telefone', maskPhone(e.target.value))}
          className={inputCls(!!errors.comprTelefone)}
        />
      </Field>
    </div>
  )
}
