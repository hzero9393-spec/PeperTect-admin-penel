import { createClient } from '@libsql/client'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Create Prisma adapter
const adapterFactory = new PrismaLibSql({
  url: 'libsql://pepertect-hzero9393-spec.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5ODUyOTQsImlkIjoiMDE5ZWFhZmQtYTMwMS03NjY4LThlMGMtY2ZhMmRjNTM1ZGU3IiwicmlkIjoiMGY3N2Y5MzEtMWMxNi00NGZmLThiYzUtNzdiYjE2YzBiN2M5In0.WMPoXnKslI1pqDF3vmThnaU3nb66_l1AXyhITTe4KFeHY1XRj0STdC9hbRH4AgQffXaQcfkRmswlyEekTtmWAA',
})

// Create Prisma client
const prisma = new PrismaClient({
  adapter: adapterFactory,
  log: ['query', 'error', 'warn'],
})

async function testConnection() {
  try {
    console.log('🔍 Testing Turso connection...')
    console.log('📡 URL:', 'libsql://pepertect-hzero9393-spec.aws-ap-south-1.turso.io')

    // Test raw query
    console.log('\n📝 Executing raw query...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Raw query successful:', result)

    // Check if tables exist
    console.log('\n📊 Checking existing tables...')
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table'
    `
    console.log('📋 Tables:', tables)

    console.log('\n✅ Connection successful!')
  } catch (error) {
    console.error('\n❌ Connection failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()