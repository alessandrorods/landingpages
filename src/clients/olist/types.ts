export interface OlistOrderPayload {
  pedido: {
    situacao: string
    data_prevista: string
    ecommerce?: string
    marcadores: Array<{ marcador: { descricao: string } }>
    valor_frete: number
    frete_por_conta: string
    forma_frete?: string
    obs?: string
    obs_internas?: string
    forma_pagamento?: string
    parcelas?: Array<{
      parcela: {
        dias: number
        data: string
        valor: number
        forma_pagamento: string
        meio_pagamento: string
      }
    }>
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

export interface OlistMutationResponse {
  retorno?: {
    status?: string
    erros?: Array<{ erro: string }>
    registros?: {
      registro?: { id: number; numero: string; status?: string }
    }
  }
}

export interface OlistCreatedOrder {
  id: number
  numero: string
}

export type OlistOrderStatus =
  | 'aberto'
  | 'aprovado'
  | 'preparando_envio'
  | 'faturado'
  | 'pronto_envio'
  | 'enviado'
  | 'entregue'
  | 'nao_entregue'
  | 'cancelado'

// ─── Read types (list + get) ───────────────────────────────────────────────────

export interface OlistOrderSummary {
  id: number
  numero: number
  numero_ecommerce: string
  data_pedido: string
  data_prevista: string
  nome: string
  valor: string
  situacao: string
}

export interface OlistOrderCustomer {
  nome: string
  fone: string
  celular?: string
  email?: string
  // Present in LI orders (address comes via customer, not endereco_entrega)
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
}

export interface OlistAddress {
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

export interface OlistOrderItem {
  id?: string
  codigo?: string
  descricao: string
  unidade?: string
  quantidade: string
  valor_unitario: string
  valor_total?: string
}

export interface OlistOrderDetails {
  id: number
  numero: number
  numero_ecommerce?: string
  situacao: string
  data_pedido?: string
  data_prevista?: string
  obs?: string
  obs_interna?: string  // used by Loja Integrada; contains delivery data + card message
  obs_internas?: string
  forma_frete?: string
  nome_transportador?: string
  valor_frete?: string
  valor_total?: string
  cliente: OlistOrderCustomer
  enderecos?: Array<{ endereco: OlistAddress }>
  endereco_entrega?: OlistAddress
  itens?: Array<{ item: OlistOrderItem }>
}

export interface OlistListOrdersResponse {
  retorno?: {
    status_processamento?: number
    status?: string
    codigo_erro?: number
    erros?: Array<{ erro: string }>
    pagina?: string
    numero_paginas?: string
    pedidos?: Array<{ pedido: OlistOrderSummary }>
  }
}

export interface OlistGetOrderResponse {
  retorno?: {
    status_processamento?: number
    status?: string
    erros?: Array<{ erro: string }>
    pedido?: OlistOrderDetails
  }
}

export interface OlistUpdateOrderData {
  obs?: string
  obs_interna?: string
  data_prevista?: string
  data_envio?: string
}

export interface OlistProduct {
  id: number
  codigo: string
  nome: string
  preco: string
  situacao: string
  unidade?: string
}

export interface OlistProductsResponse {
  retorno?: {
    status?: string
    codigo_erro?: number
    erros?: Array<{ erro: string }>
    produtos?: Array<{ produto: OlistProduct }>
  }
}

export interface OlistUpdateResponse {
  retorno?: {
    status_processamento?: string
    status?: string
    codigo_erro?: number
    erros?: Array<{ erro: string; campo?: string }>
  }
}
