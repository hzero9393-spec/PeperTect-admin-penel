import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: 'libsql://pepertect-hzero9393-spec.aws-ap-south-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const prisma = new PrismaClient({ adapter })

const admins = await prisma.$queryRaw`SELECT id, username, name, email, role FROM admins`
console.log('🔐 Admin Users:')
console.log(JSON.stringify(admins, null, 2))