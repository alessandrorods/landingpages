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

// ─── Read types (pesquisa + obter) ────────────────────────────────────────────

export interface TinyPedidoResumo {
  id: number
  numero: number
  numero_ecommerce: string
  data_pedido: string
  data_prevista: string
  nome: string
  valor: string
  situacao: string
}

export interface TinyPedidoCliente {
  nome: string
  fone: string
  celular?: string
  email?: string
}

export interface TinyEndereco {
  tipo?: string
  nome_destinatario: string
  endereco: string
  numero: string
  complemento?: string
  bairro: string
  cep: string
  cidade: string
  uf: string
  fone?: string
}

export interface TinyPedidoItem {
  id?: string
  codigo?: string
  descricao: string
  unidade?: string
  quantidade: string
  valor_unitario: string
  valor_total?: string
}

export interface TinyPedidoCompleto {
  id: number
  numero: number
  numero_ecommerce?: string
  situacao: string
  data_pedido?: string
  data_prevista?: string
  obs?: string
  obs_internas?: string
  forma_frete?: string
  valor_frete?: string
  valor_total?: string
  cliente: TinyPedidoCliente
  enderecos?: Array<{ endereco: TinyEndereco }>
  endereco_entrega?: TinyEndereco
  itens?: Array<{ item: TinyPedidoItem }>
}

export interface TinyPedidosResponse {
  retorno?: {
    status_processamento?: number
    status?: string
    codigo_erro?: number
    erros?: Array<{ erro: string }>
    pagina?: string
    numero_paginas?: string
    pedidos?: Array<{ pedido: TinyPedidoResumo }>
  }
}

export interface TinyPedidoObterResponse {
  retorno?: {
    status_processamento?: number
    status?: string
    erros?: Array<{ erro: string }>
    pedido?: TinyPedidoCompleto
  }
}

export interface TinyAlterarPedidoDados {
  obs?: string
  obs_interna?: string
  data_prevista?: string
  data_envio?: string
}

export interface TinyAlterarResponse {
  retorno?: {
    status_processamento?: string
    status?: string
    codigo_erro?: number
    erros?: Array<{ erro: string; campo?: string }>
  }
}
