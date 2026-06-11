import { db } from '../src/lib/db'

async function inspectSchema() {
  try {
    // Get all tables
    const tables = await db.$queryRaw<{ name: string }[]>`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `

    const schemaData: any = {}

    for (const table of tables) {
      // Get table schema
      const columns = await db.$queryRaw`
        SELECT * FROM pragma_table_info(${table.name})
      `
      schemaData[table.name] = columns
    }

    console.log(JSON.stringify(schemaData, null, 2))

    await db.$disconnect()
  } catch (error) {
    console.error('❌ Error:', error)
    await db.$disconnect()
    throw error
  }
}

inspectSchema()