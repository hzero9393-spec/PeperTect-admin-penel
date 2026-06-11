import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma adapter for Turso
const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL || 'libsql://pepertect-hzero9393-spec.aws-ap-south-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db