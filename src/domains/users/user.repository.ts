import prisma from '@/core/db/client'
import type { Role } from '@/domains/admin/auth'

export function createUserRepository() {
  return {
    findByUsername: (username: string) =>
      prisma.user.findUnique({ where: { username } }),

    create: (data: { username: string; password: string; role: Role }) =>
      prisma.user.create({ data }),

    hasAny: () => prisma.user.count().then((c: number) => c > 0),
  }
}

export type UserRepository = ReturnType<typeof createUserRepository>
