import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

// Reutiliza a instância entre hot-reloads do Next.js em dev
const prisma = globalThis.prisma ?? createClient()
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export default prisma
