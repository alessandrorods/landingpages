import { unstable_cache } from 'next/cache'
import { createOlistClient } from './client'

export function obterPedidoCached(id: number) {
  return unstable_cache(
    () => {
      const client = createOlistClient(process.env.TINY_TOKEN!)
      return client.obterPedido(id)
    },
    [`pedido-${id}`],
    { revalidate: 120, tags: [`pedido-${id}`] },
  )()
}
