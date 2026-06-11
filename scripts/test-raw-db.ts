import { db } from '../src/lib/db'

async function testRawQueries() {
  try {
    console.log('🔍 Testing database connection with raw queries...\n')

    // Test query
    const result = await db.$queryRaw`SELECT 1 as test`
    console.log('✅ Connection successful:', result)

    // Count users
    const userCount = await db.$queryRaw`SELECT COUNT(*) as count FROM users`
    console.log('\n👥 User count:', userCount)

    // Count admins
    const adminCount = await db.$queryRaw`SELECT COUNT(*) as count FROM admins`
    console.log('🔐 Admin count:', adminCount)

    // Get recent trades
    const recentTrades = await db.$queryRaw`
      SELECT * FROM trades ORDER BY createdAt DESC LIMIT 3
    `
    console.log('\n📊 Recent trades:', recentTrades)

    console.log('\n✅ Turso database is connected and working!')
  } catch (error) {
    console.error('\n❌ Error:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

testRawQueries()