import { cacheLife, cacheTag } from 'next/cache'
import { createOlistClient } from './client'

export async function obterPedidoCached(id: number) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`pedido-${id}`)
  const client = createOlistClient(process.env.TINY_TOKEN!)
  return client.obterPedido(id)
}
