interface FaixaCep {
  min: number
  max: number
}

export const FAIXAS_CEP_ATENDIDAS: FaixaCep[] = [
  { min: 8700000, max: 8899999 }, // Mogi das Cruzes / SP
]

export function cepAtendido(cep: string): boolean {
  const n = parseInt(cep.replace(/\D/g, ''), 10)
  if (isNaN(n)) return false
  return FAIXAS_CEP_ATENDIDAS.some(f => n >= f.min && n <= f.max)
}
