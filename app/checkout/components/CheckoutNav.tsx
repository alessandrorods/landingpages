import type { CepStatus } from '../types'

interface Props {
  step: number
  cepStatus: CepStatus
  submitting: boolean
  hasProduct: boolean
  submitError: string | null
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
}

export function CheckoutNav({ step, cepStatus, submitting, hasProduct, submitError, onNext, onBack, onSubmit }: Props) {
  return (
    <div className="mt-4 space-y-3">
      {step === 3 && (
        <>
          {submitError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !hasProduct}
            className="w-full bg-[#1E7439] hover:bg-[#155C2C] active:scale-95 text-white font-bold py-4 rounded-xl transition-all text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando pedido…' : 'Finalizar e ir para pagamento →'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full border border-gray-300 bg-white text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm cursor-pointer"
          >
            ← Voltar e editar
          </button>
        </>
      )}

      {step < 3 && (
        <div className={`flex gap-3 ${step > 0 ? '' : 'justify-end'}`}>
          {step > 0 && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 border border-gray-300 bg-white text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm cursor-pointer"
            >
              ← Voltar
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={step === 0 && cepStatus !== 'ok'}
            className={`${step > 0 ? 'flex-1' : 'w-full'} bg-[#1E7439] hover:bg-[#155C2C] active:scale-95 text-white font-bold py-3 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Continuar →
          </button>
        </div>
      )}
    </div>
  )
}
