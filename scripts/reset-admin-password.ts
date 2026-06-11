import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const adapter = new PrismaLibSql({
  url: 'libsql://pepertect-hzero9393-spec.aws-ap-south-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const prisma = new PrismaClient({ adapter })

const newPassword = 'admin123'
const passwordHash = await bcrypt.hash(newPassword, 10)

await prisma.$queryRaw`
  UPDATE admins
  SET passwordHash = ${passwordHash}
  WHERE username = 'admin'
`

console.log('✅ Admin password updated successfully!')
console.log('🔑 Username: admin')
console.log('🔑 Password: admin123')
console.log('\n⚠️  Login karte hi password change kar lena!')