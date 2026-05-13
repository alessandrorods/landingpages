import type { EnderecoForm, CepStatus } from '../types'
import { Field, inputCls } from './Field'

interface Props {
  endereco: EnderecoForm
  cepStatus: CepStatus
  cepDisplayError?: string
  errors: Record<string, string>
  onCEP: (raw: string) => void
  onChange: (k: keyof EnderecoForm, v: string) => void
}

export function StepEndereco({ endereco, cepStatus, cepDisplayError, errors, onCEP, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-800">Endereço de entrega</h2>
        <p className="text-xs text-gray-400 mt-0.5">Atendemos apenas em Mogi das Cruzes / SP</p>
      </div>

      <Field label="CEP" required error={cepDisplayError}>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder="00000-000"
            value={endereco.cep}
            onChange={e => onCEP(e.target.value)}
            maxLength={9}
            className={inputCls(!!cepDisplayError)}
          />
          {cepStatus === 'loading' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
              Buscando…
            </span>
          )}
          {cepStatus === 'ok' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E7439] font-bold pointer-events-none">
              ✓
            </span>
          )}
        </div>
      </Field>

      {cepStatus === 'ok' && (
        <>
          <Field label="Rua / Avenida" required error={errors.logradouro}>
            <input
              type="text"
              placeholder="Ex: Rua das Flores"
              value={endereco.logradouro}
              onChange={e => onChange('logradouro', e.target.value)}
              className={inputCls(!!errors.logradouro)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Número" required error={errors.numero}>
              <input
                type="text"
                placeholder="Ex: 142"
                value={endereco.numero}
                onChange={e => onChange('numero', e.target.value)}
                className={inputCls(!!errors.numero)}
              />
            </Field>
            <Field label="Complemento" hint="opcional">
              <input
                type="text"
                placeholder="Apto, bloco, casa…"
                value={endereco.complemento}
                onChange={e => onChange('complemento', e.target.value)}
                className={inputCls()}
              />
            </Field>
          </div>

          <Field label="Bairro" required error={errors.bairro}>
            <input
              type="text"
              placeholder="Ex: Centro"
              value={endereco.bairro}
              onChange={e => onChange('bairro', e.target.value)}
              className={inputCls(!!errors.bairro)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade">
              <input
                type="text"
                value="Mogi das Cruzes"
                disabled
                className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
              />
            </Field>
            <Field label="Estado">
              <input
                type="text"
                value="SP"
                disabled
                className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
              />
            </Field>
          </div>
        </>
      )}
    </div>
  )
}
