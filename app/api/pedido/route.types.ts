export interface PedidoBody {
  sku: string
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
  comprador: {
    nome: string
    telefone: string
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
