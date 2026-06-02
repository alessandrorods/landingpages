import prisma from '@/core/db/client'

export function createConfigRepository() {
  return {
    get: (key: string) =>
      prisma.systemConfig.findUnique({ where: { key } }),

    set: (key: string, value: unknown) =>
      prisma.systemConfig.upsert({
        where:  { key },
        update: { value: value as never },
        create: { key, value: value as never },
      }),

    list: () =>
      prisma.systemConfig.findMany({ orderBy: { key: 'asc' } }),
  }
}

export type ConfigRepository = ReturnType<typeof createConfigRepository>
