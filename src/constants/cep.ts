import type { FaixaCep } from './cep.types'
import type { DeliveryRegion } from '@/domains/config/config.types'

export type { FaixaCep } from './cep.types'

export const FAIXAS_CEP_ATENDIDAS: FaixaCep[] = [
  { min: 8700000, max: 8899999 }, // Mogi das Cruzes / SP
]

export function cepAtendido(cep: string): boolean {
  const n = parseInt(cep.replace(/\D/g, ''), 10)
  if (isNaN(n)) return false
  return FAIXAS_CEP_ATENDIDAS.some(f => n >= f.min && n <= f.max)
}

export function cepAtendidoPorRegioes(cep: string, regions: DeliveryRegion[]): boolean {
  const n = cep.replace(/\D/g, '')
  return regions.some((r) => r.zipRanges.some((z) => n >= z.zipStart && n <= z.zipEnd))
}
