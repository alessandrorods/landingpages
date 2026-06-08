export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '')
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '')
}

export async function lookupCep(cep: string): Promise<{ logradouro: string; bairro: string } | null> {
  const c = cep.replace(/\D/g, '')
  if (c.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${c}/json/`)
    const data = await res.json()
    if (data.erro) return null
    return { logradouro: data.logradouro ?? '', bairro: data.bairro ?? '' }
  } catch {
    return null
  }
}
