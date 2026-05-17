import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService } from '@/domains/config/config.service'
import { PRODUCTS } from '@/constants/products'
import type { PedidoBody } from './types'

const VALID_SKUS = new Set(PRODUCTS.map((p) => p.sku))

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function digits(v: string) {
  return v.replace(/\D/g, '')
}

export async function validatePedidoBody(body: unknown): Promise<PedidoBody> {
  const periods = await createConfigService(createConfigRepository()).get('deliveryPeriods')
  const validPeriods = new Set(periods.map((p) => p.id))

  if (!body || typeof body !== 'object') throw new ValidationError('Corpo inválido')
  const b = body as Record<string, unknown>

  // sku
  if (!isString(b.sku) || !VALID_SKUS.has(b.sku))
    throw new ValidationError('Produto inválido')

  // endereco
  const end = b.endereco
  if (!end || typeof end !== 'object') throw new ValidationError('Endereço ausente')
  const e = end as Record<string, unknown>

  if (!isString(e.cep) || digits(e.cep).length !== 8)
    throw new ValidationError('CEP inválido')

  if (!isString(e.logradouro) || !e.logradouro.trim() || e.logradouro.length > 200)
    throw new ValidationError('Logradouro inválido')

  if (!isString(e.numero) || !e.numero.trim() || e.numero.length > 20)
    throw new ValidationError('Número inválido')

  if (!isString(e.bairro) || !e.bairro.trim() || e.bairro.length > 100)
    throw new ValidationError('Bairro inválido')

  if (e.complemento !== undefined && (!isString(e.complemento) || e.complemento.length > 100))
    throw new ValidationError('Complemento inválido')

  if (!isString(e.dataEntrega) || !/^\d{2}\/\d{2}\/\d{4}$/.test(e.dataEntrega))
    throw new ValidationError('Data de entrega inválida')

  if (!isString(e.periodoEntrega) || !validPeriods.has(e.periodoEntrega))
    throw new ValidationError('Período de entrega inválido')

  // destinatario
  const dest = b.destinatario
  if (!dest || typeof dest !== 'object') throw new ValidationError('Destinatário ausente')
  const d = dest as Record<string, unknown>

  if (typeof d.paraOutraPessoa !== 'boolean')
    throw new ValidationError('Campo paraOutraPessoa inválido')

  if (d.paraOutraPessoa) {
    if (!isString(d.nome) || !d.nome.trim() || d.nome.length > 100)
      throw new ValidationError('Nome do destinatário inválido')
    if (!isString(d.telefone) || digits(d.telefone).length < 10 || digits(d.telefone).length > 11)
      throw new ValidationError('Telefone do destinatário inválido')
  }

  if (d.mensagemCartao !== undefined && (!isString(d.mensagemCartao) || d.mensagemCartao.length > 500))
    throw new ValidationError('Mensagem do cartão inválida')

  // comprador
  const comp = b.comprador
  if (!comp || typeof comp !== 'object') throw new ValidationError('Comprador ausente')
  const c = comp as Record<string, unknown>

  if (!isString(c.nome) || !c.nome.trim() || c.nome.length > 100)
    throw new ValidationError('Nome do comprador inválido')

  if (!isString(c.telefone) || digits(c.telefone).length < 10 || digits(c.telefone).length > 11)
    throw new ValidationError('Telefone do comprador inválido')

  return b as unknown as PedidoBody
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
