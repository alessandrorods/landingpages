import type { FormData } from '../types'
import type { Product } from '@/constants/products'
import { formatPrice } from '../utils'
import { FRETE_VALOR, DATAS_ENTREGA, PERIODOS_ENTREGA } from '@/constants/pedido'

interface Props {
  form: FormData
  product: Product | undefined
  onNavigate: (step: number) => void
}

function SectionHeader({ label, onEdit }: { label: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          editar
        </button>
      )}
    </div>
  )
}

const CARD = 'bg-white text-gray-900 rounded-2xl shadow-sm border border-gray-100 p-6 mt-4'

export function StepResumo({ form, product, onNavigate }: Props) {
  const dataLabel = DATAS_ENTREGA.find(d => d.valor === form.endereco.dataEntrega)
  const periodoLabel = PERIODOS_ENTREGA.find(p => p.id === form.endereco.periodoEntrega)?.label

  return (
    <>
      {/* Card 1 — Produto */}
      <div className="bg-white text-gray-900 rounded-2xl shadow-sm border border-gray-100 mt-4 flex items-stretch overflow-hidden">
        {product ? (
          <>
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="w-28 object-cover shrink-0"
              />
            )}
            <div className="flex-1 p-5 flex justify-between items-start gap-3">
              <p className="text-sm text-gray-800 leading-snug">{product.name}</p>
              <div className="text-right shrink-0">
                {product.originalPrice && (
                  <p className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
                )}
                <p className="text-sm font-semibold text-[#1E7439]">{formatPrice(product.price)}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-amber-700 p-6">
            Nenhum produto selecionado.{' '}
            <a href="/dia-das-maes" className="underline font-semibold">Escolher produto</a>
          </p>
        )}
      </div>

      {/* Card 2 — Entrega, Destinatário, Comprador */}
      <div className={`${CARD} divide-y divide-gray-100`}>
        <div className="pb-4">
          <SectionHeader label="Entrega" onEdit={() => onNavigate(0)} />
          <p className="text-sm text-gray-800">
            {form.endereco.logradouro}, {form.endereco.numero}
            {form.endereco.complemento ? `, ${form.endereco.complemento}` : ''}
          </p>
          <p className="text-sm text-gray-500">{form.endereco.bairro} — Mogi das Cruzes / SP</p>
          <p className="text-sm text-gray-500">CEP {form.endereco.cep}</p>
          {dataLabel && (
            <p className="text-sm text-gray-700 mt-1.5 font-medium">
              {dataLabel.dia} de maio
              {dataLabel.destaque && (
                <span className="ml-1.5 text-xs font-bold text-amber-600">{dataLabel.labelDestaque}</span>
              )}
              {periodoLabel && <span className="text-gray-500 font-normal"> — {periodoLabel}</span>}
            </p>
          )}
        </div>

        <div className="py-4">
          <SectionHeader label="Destinatário" onEdit={() => onNavigate(1)} />
          {form.destinatario.paraOutraPessoa ? (
            <>
              <p className="text-sm text-gray-800">{form.destinatario.nome}</p>
              <p className="text-sm text-gray-500">{form.destinatario.telefone}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">Você mesmo (dados do comprador)</p>
          )}
          {form.destinatario.comMensagem && form.destinatario.mensagemCartao && (
            <p className="text-sm text-gray-500 italic mt-1">&ldquo;{form.destinatario.mensagemCartao}&rdquo;</p>
          )}
          {!form.destinatario.comMensagem && (
            <p className="text-xs text-gray-400 mt-1">Sem mensagem no cartão</p>
          )}
        </div>

        <div className="pt-4">
          <SectionHeader label="Comprador" onEdit={() => onNavigate(2)} />
          <p className="text-sm text-gray-800">{form.comprador.nome}</p>
          <p className="text-sm text-gray-500">{form.comprador.telefone}</p>
        </div>
      </div>

      {/* Card 3 — Totais */}
      {product && (
        <div className="bg-[#F0F9F3] rounded-2xl border border-green-100 p-6 mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Produto</span>
            <span>{formatPrice(product.price)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Taxa de entrega</span>
            <span>{formatPrice(FRETE_VALOR)}</span>
          </div>
          <div className="flex justify-between items-baseline border-t border-green-100 pt-2.5">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-xl font-extrabold text-[#1E7439]">
              {formatPrice(product.price + FRETE_VALOR)}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
