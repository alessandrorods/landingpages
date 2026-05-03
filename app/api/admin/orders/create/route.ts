import { createOlistClient, OlistClientError } from '@/lib/olist/client'
import { createMercadoPagoClient } from '@/lib/mercadopago/client'
import { createPagamentoService, PagamentoServiceError } from '@/lib/mercadopago/pagamento.service'
import { signToken } from '@/lib/checkout/token'
import { FRETE_POR_CONTA, PERIODOS_ENTREGA } from '@/constants/pedido'
import type { TinyPedidoPayload, SituacaoPedido } from '@/lib/olist/types'

export type FormaPagamento = 'pix' | 'cartao' | 'link_mp'

export interface PedidoManualItem {
  sku: string
  nome: string
  preco: number
  quantidade: number
}

interface PedidoManualBody {
  itens: PedidoManualItem[]
  frete: number
  endereco: {
    cep: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    dataEntrega: string
    periodoEntrega: string
  }
  destinatario: {
    paraOutraPessoa: boolean
    nome: string
    telefone: string
    mensagemCartao?: string
  }
  comprador: { nome: string; telefone: string }
  obs?: string
  pagamento: FormaPagamento
}

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} não configurado`)
  return value
}

function buildPayload(body: PedidoManualBody): TinyPedidoPayload {
  const formaFrete = PERIODOS_ENTREGA.find((p) => p.id === body.endereco.periodoEntrega)?.idOlist
  const mensagem = body.destinatario.mensagemCartao?.trim() ?? ''

  return {
    pedido: {
      situacao: 'aberto',
      data_prevista: body.endereco.dataEntrega,
      marcadores: [{ marcador: { descricao: 'pedido-manual' } }],
      valor_frete: body.frete,
      frete_por_conta: FRETE_POR_CONTA,
      forma_envio: 'T',
      ...(formaFrete && { forma_frete: formaFrete }),
      ...(mensagem && { obs_internas: mensagem }),
      ...(body.obs?.trim() && { obs: body.obs.trim() }),
      cliente: {
        nome: body.comprador.nome,
        fone: body.comprador.telefone,
      },
      endereco_entrega: {
        nome_destinatario: body.destinatario.paraOutraPessoa
          ? body.destinatario.nome
          : body.comprador.nome,
        fone: body.destinatario.paraOutraPessoa
          ? body.destinatario.telefone
          : body.comprador.telefone,
        endereco: body.endereco.logradouro,
        numero: body.endereco.numero,
        complemento: body.endereco.complemento ?? '',
        bairro: body.endereco.bairro,
        cep: body.endereco.cep.replace(/\D/g, ''),
        cidade: 'Mogi das Cruzes',
        uf: 'SP',
      },
      itens: body.itens.map((item) => ({
        item: {
          descricao: item.nome,
          unidade: 'UN',
          quantidade: item.quantidade,
          valor_unitario: item.preco,
        },
      })),
    },
  }
}

function validate(raw: unknown): PedidoManualBody {
  const b = raw as Record<string, unknown>
  const itens = b.itens as unknown[]
  const endereco = b.endereco as Record<string, unknown>
  const destinatario = b.destinatario as Record<string, unknown>
  const comprador = b.comprador as Record<string, unknown>

  if (!Array.isArray(itens) || itens.length === 0) throw new Error('Adicione ao menos um produto')
  for (const item of itens) {
    const i = item as Record<string, unknown>
    if (!i.nome || typeof i.preco !== 'number' || i.preco <= 0) throw new Error('Item com preço inválido')
    if (typeof i.quantidade !== 'number' || i.quantidade < 1) throw new Error('Quantidade inválida')
  }
  if (!endereco?.logradouro || !endereco?.numero || !endereco?.bairro || !endereco?.cep) throw new Error('Endereço incompleto')
  if (!endereco?.dataEntrega) throw new Error('Data de entrega obrigatória')
  if (!destinatario?.nome || !destinatario?.telefone) throw new Error('Destinatário incompleto')
  if (!comprador?.nome || !comprador?.telefone) throw new Error('Comprador incompleto')
  if (!['pix', 'cartao', 'link_mp'].includes(b.pagamento as string)) throw new Error('Forma de pagamento inválida')

  return raw as PedidoManualBody
}

export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return Response.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  let body: PedidoManualBody
  try {
    body = validate(raw)
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 })
  }

  const olistClient = createOlistClient(getEnv('TINY_TOKEN'))

  let pedidoId: number
  let pedidoNumero: string
  try {
    const data = await olistClient.incluirPedido(buildPayload(body))
    if (data.retorno?.status !== 'OK') {
      const detalhes = (data.retorno?.erros ?? []).map((e) => e.erro).join('; ')
      return Response.json({ error: detalhes || 'Erro ao criar pedido no Tiny' }, { status: 502 })
    }
    const registro = data.retorno?.registros?.registro
    if (!registro) return Response.json({ error: 'Resposta inesperada do Tiny' }, { status: 502 })
    pedidoId = registro.id
    pedidoNumero = registro.numero
  } catch (err) {
    if (err instanceof OlistClientError) return Response.json({ error: err.message }, { status: 502 })
    throw err
  }

  // PIX / cartão → aprovar imediatamente
  if (body.pagamento !== 'link_mp') {
    try {
      await olistClient.atualizarSituacaoPedido(pedidoId, 'aprovado' as SituacaoPedido)
    } catch (err) {
      console.error('[orders/create] falha ao aprovar pedido', { pedidoId, err })
    }
    return Response.json({ id: pedidoId, numero: pedidoNumero })
  }

  // Link MP → gerar preferência
  try {
    const mpClient = createMercadoPagoClient(getEnv('MP_ACCESS_TOKEN'))
    const pagamentoService = createPagamentoService(mpClient)
    const baseUrl = getEnv('NEXT_PUBLIC_SITE_URL').replace(/\/$/, '')
    const valorItens = body.itens.reduce((sum, i) => sum + i.preco * i.quantidade, 0)
    const valor = valorItens + body.frete
    const primeiroItem = body.itens[0]
    const token = signToken({ pedidoId, pedido: pedidoNumero, sku: primeiroItem.sku || 'manual', nome: body.comprador.nome, valor })
    const confirmacaoUrl = `${baseUrl}/payment/finish?payment_token=${token}`

    const mpItems = body.itens.map((item) => ({
      id: item.sku || 'manual',
      title: item.nome,
      quantity: item.quantidade,
      unit_price: item.preco,
      currency_id: 'BRL' as const,
    }))

    const preferencia = await pagamentoService.criarPreferencia({
      external_reference: String(pedidoId),
      items: [...mpItems, { id: 'frete', title: 'Taxa de entrega', quantity: 1, unit_price: body.frete, currency_id: 'BRL' }],
      payer: {
        name: body.comprador.nome,
        phone: { number: body.comprador.telefone.replace(/\D/g, '') },
      },
      back_urls: { success: confirmacaoUrl, failure: confirmacaoUrl, pending: confirmacaoUrl },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/payment/webhook`,
    })

    return Response.json({ id: pedidoId, numero: pedidoNumero, linkPagamento: preferencia.initPoint })
  } catch (err) {
    if (err instanceof PagamentoServiceError) {
      return Response.json({ error: err.message }, { status: 502 })
    }
    throw err
  }
}
