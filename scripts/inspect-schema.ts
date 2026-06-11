import { db } from '../src/lib/db'

async function inspectSchema() {
  try {
    console.log('📊 Inspecting database schema...\n')

    // Get all tables
    const tables = await db.$queryRaw<{ name: string }[]>`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `
    console.log(`📋 Found ${tables.length} tables:\n`)

    for (const table of tables) {
      console.log(`\n📄 Table: ${table.name}`)

      // Get table schema
      const columns = await db.$queryRaw`
        SELECT * FROM pragma_table_info(${table.name})
      `
      console.log('   Columns:')
      for (const col of columns as any) {
        console.log(`   - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''} ${col.pk ? 'PRIMARY KEY' : ''}`)
      }
    }

    await db.$disconnect()
  } catch (error) {
    console.error('❌ Error:', error)
    await db.$disconnect()
    throw error
  }
}

inspectSchema()