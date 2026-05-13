import { unstable_cache } from 'next/cache'
import { createOlistClient } from '@/clients/olist/client'

export function getOrderCached(id: number) {
  return unstable_cache(
    () => {
      console.log(`[pedido-cache] MISS id=${id}`)
      const client = createOlistClient(process.env.TINY_TOKEN!)
      return client.getOrder(id)
    },
    [`pedido-${id}`],
    { revalidate: 600, tags: [`pedido-${id}`] },
  )()
}
