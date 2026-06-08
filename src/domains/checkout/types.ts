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

export interface CheckoutResult {
  pedidoId: number
  pedidoNumero: string
  redirectUrl: string
}
