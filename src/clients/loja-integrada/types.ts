export interface LICliente {
  id: number
  email: string | null
  nome: string
  telefone_celular: string | null
  telefone_comercial: string | null
  telefone_principal: string | null
  situacao: string
  cpf: string | null
  cnpj: string | null
}

export interface LIEnderecoEntrega {
  id: number
  nome: string | null
  endereco: string
  numero: string
  complemento: string | null
  referencia: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export interface LISituacao {
  id: number
  codigo: string
  nome: string
  aprovado: boolean
  cancelado: boolean
  final: boolean
  notificar_comprador: boolean
  padrao: boolean
  situacao_alterada?: boolean  // present in webhook push, absent in GET response
}

export interface LIItem {
  linha: number
  id: number
  produto_id: number
  sku: string
  nome: string
  tipo: string
  quantidade: number | string   // API returns string in GET responses
  preco_venda: number | string  // API returns string in GET responses
  preco_subtotal: number | string
}

export interface LIEnvio {
  id: number
  valor: string | number
  prazo: number | null
  objeto: string | null
  forma_envio: {
    id: number
    codigo: string
    nome: string
    tipo: string | null
  }
}

export interface LIWebhookPayload {
  token?: string
  tipo: string
  id: number
  numero: number
  valor_desconto: number | string
  valor_envio: number | string
  valor_subtotal: number | string
  valor_total: number | string
  cliente_obs: string | null
  data_criacao: string
  data_modificacao: string
  cliente: LICliente
  endereco_entrega: LIEnderecoEntrega
  situacao: LISituacao
  envios: LIEnvio[]
  itens: LIItem[]
}

export interface LIFormaEnvio {
  id: number
  codigo: string
  nome: string
  tipo: string
  configuracoes: {
    ativo: boolean
    disponivel: boolean
  }
}

export interface LIListFormasEnvioResponse {
  meta: { total_count: number }
  objects: LIFormaEnvio[]
}

export interface LIWebhookStatusResponse {
  aprovado: boolean
  cancelado: boolean
  codigo: string
  final: boolean
  id: number
  nome: string
  notificar_comprador: boolean
  padrao: boolean
  pedido: string
  resource_uri: string
}
