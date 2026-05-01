export interface EnderecoForm {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  dataEntrega: string
  periodoEntrega: string
}

export interface DestinatarioForm {
  paraOutraPessoa: boolean
  nome: string
  telefone: string
  comMensagem: boolean
  mensagemCartao: string
}

export interface CompradorForm {
  nome: string
  telefone: string
}

export interface FormData {
  endereco: EnderecoForm
  destinatario: DestinatarioForm
  comprador: CompradorForm
}

export type CepStatus = 'idle' | 'loading' | 'ok' | 'fora-area' | 'invalido'
