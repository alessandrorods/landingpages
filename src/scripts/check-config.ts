import prisma from '@/core/db/client'

async function main() {
  const rows = await prisma.systemConfig.findMany()
  if (rows.length === 0) {
    console.log('system_config está vazia — nenhum período configurado')
  } else {
    console.log(JSON.stringify(rows, null, 2))
  }
}

main().finally(() => prisma.$disconnect())
