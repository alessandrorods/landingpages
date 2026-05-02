export interface TinyPedidoPayload {
  pedido: {
    situacao: string
    data_prevista: string
    ecommerce: string
    marcadores: Array<{ marcador: { descricao: string } }>
    valor_frete: number
    frete_por_conta: string
    forma_frete?: string
    obs_internas?: string
    forma_envio: string
    cliente: {
      nome: string
      fone: string
    }
    endereco_entrega: {
      nome_destinatario: string
      fone: string
      endereco: string
      numero: string
      complemento: string
      bairro: string
      cep: string
      cidade: string
      uf: string
    }
    itens: Array<{
      item: {
        descricao: string
        unidade: string
        quantidade: number
        valor_unitario: number
      }
    }>
  }
}

export interface TinyResponse {
  retorno?: {
    status?: string
    erros?: Array<{ erro: string }>
    registros?: {
      registro?: { id: number; numero: string; status?: string }
    }
  }
}

export interface OlistPedidoCriado {
  id: number
  numero: string
}

export type SituacaoPedido =
  | 'aberto'
  | 'aprovado'
  | 'preparando_envio'
  | 'faturado'
  | 'pronto_envio'
  | 'enviado'
  | 'entregue'
  | 'nao_entregue'
  | 'cancelado'
