import type { FormData, ViaCEPResult } from './types'

export const STORAGE_KEY = 'checkout_v1'

export const EMPTY_FORM: FormData = {
  endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', dataEntrega: '', periodoEntrega: '' },
  destinatario: { paraOutraPessoa: true, nome: '', telefone: '', comMensagem: true, mensagemCartao: '' },
  comprador: { nome: '', telefone: '' },
}

export function formatPrice(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function maskCEP(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export async function fetchViaCEP(digits: string): Promise<ViaCEPResult | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!res.ok) return null
    const data = (await res.json()) as ViaCEPResult
    return data.erro ? null : data
  } catch {
    return null
  }
}
