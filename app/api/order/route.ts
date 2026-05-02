import { processarCheckout, CheckoutError } from '@/lib/checkout/checkout.service'
import { validatePedidoBody, ValidationError } from '@/lib/checkout/validate'

export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return Response.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  let body: ReturnType<typeof validatePedidoBody>
  try {
    body = validatePedidoBody(raw)
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 })
    }
    return Response.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  try {
    const resultado = await processarCheckout(body)
    return Response.json({ id: resultado.pedidoId, numero: resultado.pedidoNumero, redirectUrl: resultado.redirectUrl })
  } catch (err) {
    if (err instanceof CheckoutError) {
      // erros 5xx não expõem detalhes internos ao cliente
      if (err.status >= 500) {
        console.error('Erro no checkout', { message: err.message, detalhes: err.detalhes })
        return Response.json({ error: 'Erro interno. Tente novamente.' }, { status: err.status })
      }
      return Response.json({ error: err.message }, { status: err.status })
    }
    console.error('Erro inesperado no checkout', err)
    return Response.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
