﻿import { PRODUCTS } from '@/constants/products'
import { CAMPANHA_ECOMMERCE, CAMPANHA_MARCADOR, FRETE_VALOR, FRETE_POR_CONTA, PERIODOS_ENTREGA } from '@/constants/pedido'
import { OlistClientError, type OlistClient } from '@/clients/olist/client'
import type { OlistOrderPayload, OlistCreatedOrder, OlistOrderStatus } from '@/clients/olist/types'
import type { PedidoBody } from '@/domains/checkout/types'

export class PedidoServiceError extends Error {
  constructor(
    message: string,
    public readonly detalhes?: string,
  ) {
    super(message)
    this.name = 'PedidoServiceError'
  }
}

function buildPayload(body: PedidoBody): OlistOrderPayload {
  const product = PRODUCTS.find((p) => p.sku === body.sku)
  if (!product) throw new PedidoServiceError('Produto não encontrado')

  const mensagem = body.destinatario.mensagemCartao?.trim() ?? ''
  const formaFrete = PERIODOS_ENTREGA.find((p) => p.id === body.endereco.periodoEntrega)?.idOlist

  return {
    pedido: {
      situacao: 'aberto',
      data_prevista: body.endereco.dataEntrega,
      ecommerce: CAMPANHA_ECOMMERCE,
      marcadores: [{ marcador: { descricao: CAMPANHA_MARCADOR } }],
      valor_frete: FRETE_VALOR,
      frete_por_conta: FRETE_POR_CONTA,
      ...(formaFrete && { forma_frete: formaFrete }),
      ...(mensagem && { obs_internas: mensagem }),
      forma_envio: 'T',
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
      itens: [
        {
          item: {
            descricao: product.name,
            unidade: 'UN',
            quantidade: 1,
            valor_unitario: product.price,
          },
        },
      ],
    },
  }
}

export function createPedidoService(client: OlistClient) {
  return {
    async criarPedido(body: PedidoBody): Promise<OlistCreatedOrder> {
      const payload = buildPayload(body)

      let data: Awaited<ReturnType<OlistClient['createOrder']>>
      try {
        data = await client.createOrder(payload)
      } catch (err) {
        if (err instanceof OlistClientError) throw new PedidoServiceError(err.message)
        throw err
      }

      if (data.retorno?.status !== 'OK') {
        const detalhes = (data.retorno?.erros ?? []).map((e) => e.erro).join('; ')
        throw new PedidoServiceError('Erro ao criar pedido no Olist', detalhes || 'Sem detalhes')
      }

      const registro = data.retorno?.registros?.registro
      if (!registro) throw new PedidoServiceError('Resposta inesperada do Olist')

      return { id: registro.id, numero: registro.numero }
    },

    async obterSituacao(id: number): Promise<string | undefined> {
      let data: Awaited<ReturnType<OlistClient['getOrder']>>
      try {
        data = await client.getOrder(id)
      } catch (err) {
        if (err instanceof OlistClientError) throw new PedidoServiceError(err.message)
        throw err
      }
      return data.retorno?.pedido?.situacao
    },

    async atualizarSituacao(id: number, situacao: OlistOrderStatus): Promise<void> {
      let data: Awaited<ReturnType<OlistClient['updateOrderStatus']>>
      try {
        data = await client.updateOrderStatus(id, situacao)
      } catch (err) {
        if (err instanceof OlistClientError) throw new PedidoServiceError(err.message)
        throw err
      }

      if (data.retorno?.status !== 'OK') {
        const detalhes = (data.retorno?.erros ?? []).map((e) => e.erro).join('; ')
        throw new PedidoServiceError('Erro ao atualizar situação do pedido no Olist', detalhes || 'Sem detalhes')
      }
    },
  }
}

export type PedidoService = ReturnType<typeof createPedidoService>
