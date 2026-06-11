import { db } from '../src/lib/db'

async function testDB() {
  try {
    console.log('🔍 Testing database connection...')

    // Test raw query
    const result = await db.$queryRaw`SELECT 1 as test`
    console.log('✅ Query successful:', result)

    // Check existing tables
    const tables = await db.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' LIMIT 5
    `
    console.log('📋 Sample tables:', tables)

    // Test User model query
    const userCount = await db.user.count()
    console.log('👥 User count:', userCount)

    console.log('\n✅ Database connection is working!')
  } catch (error) {
    console.error('\n❌ Database connection failed:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

testDB()