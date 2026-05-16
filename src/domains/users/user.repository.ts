import prisma from '@/core/db/client'
import type { Role } from '@/domains/admin/auth'

const userSelect = { id: true, username: true, displayName: true, role: true, createdAt: true, deletedAt: true } as const

export function createUserRepository() {
  return {
    findAll: () =>
      prisma.user.findMany({
        where: { deletedAt: null },
        select: userSelect,
        orderBy: { createdAt: 'asc' },
      }),

    findById: (id: string) =>
      prisma.user.findUnique({ where: { id } }),

    findByUsername: (username: string) =>
      prisma.user.findFirst({ where: { username, deletedAt: null } }),

    hasAny: () => prisma.user.count().then((c: number) => c > 0),

    create: (data: { username: string; displayName: string; password: string; role: Role }) =>
      prisma.user.create({ data }),

    update: (id: string, data: { username?: string; displayName?: string; role?: Role }) =>
      prisma.user.update({ where: { id }, data }),

    updatePassword: (id: string, password: string) =>
      prisma.user.update({ where: { id }, data: { password } }),

    softDelete: (id: string) =>
      prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),

    countActiveAdmins: () =>
      prisma.user.count({ where: { role: 'admin', deletedAt: null } }),
  }
}

export type UserRepository = ReturnType<typeof createUserRepository>
