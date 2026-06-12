import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = await getAdminFromToken(token)
    if (!admin) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Fetch all market data
    const [indices, stocks, fnoBanEntries, marketHolidays] = await Promise.all([
      db.$queryRaw`
        SELECT id, symbol, name, lotSize, expiryDay, tickSize, currentPrice,
               previousClose, change, changePercent, isEnabled, lastUpdated
        FROM indices
        ORDER BY symbol ASC
      ` as any[],
      db.$queryRaw`
        SELECT id, symbol, name, sector, exchange, type, lotSize, tickSize,
               currentPrice, open, high, low, previousClose, change,
               changePercent, volume, marketCap, isEnabled, lastUpdated
        FROM stocks
        ORDER BY symbol ASC
      ` as any[],
      db.$queryRaw`
        SELECT id, stockSymbol, stockName, stockId, banStartDate, banEndDate,
               reason, isActive, createdAt, updatedAt
        FROM fnoBanEntries
        ORDER BY banStartDate DESC
      ` as any[],
      db.$queryRaw`
        SELECT id, name, date, isMuhurat, muhuratStart, muhuratEnd, createdAt
        FROM marketHolidays
        ORDER BY date ASC
      ` as any[],
    ])

    return NextResponse.json({
      success: true,
      data: {
        indices,
        stocks,
        fnoBanEntries,
        marketHolidays,
      },
    })
  } catch (error) {
    console.error('Market API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = await getAdminFromToken(token)
    if (!admin) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json()
    const { action, type, data } = body

    if (action === 'create' || action === 'update') {
      switch (type) {
        case 'index': {
          if (action === 'create') {
            await db.$queryRaw`
              INSERT INTO indices (id, symbol, name, lotSize, expiryDay, tickSize,
                                   currentPrice, previousClose, change, changePercent,
                                   isEnabled, lastUpdated)
              VALUES (
                ${data.id || crypto.randomUUID()},
                ${data.symbol},
                ${data.name},
                ${data.lotSize},
                ${data.expiryDay},
                ${data.tickSize || 0.05},
                ${data.currentPrice},
                ${data.previousClose},
                ${data.change || 0},
                ${data.changePercent || 0},
                ${data.isEnabled !== false},
                ${new Date().toISOString()}
              )
            `
          } else {
            await db.$queryRaw`
              UPDATE indices
              SET symbol = ${data.symbol},
                  name = ${data.name},
                  lotSize = ${data.lotSize},
                  expiryDay = ${data.expiryDay},
                  tickSize = ${data.tickSize},
                  currentPrice = ${data.currentPrice},
                  previousClose = ${data.previousClose},
                  change = ${data.change || 0},
                  changePercent = ${data.changePercent || 0},
                  isEnabled = ${data.isEnabled !== false},
                  lastUpdated = ${new Date().toISOString()}
              WHERE id = ${data.id}
            `
          }
          break
        }

        case 'stock': {
          if (action === 'create') {
            await db.$queryRaw`
              INSERT INTO stocks (id, symbol, name, sector, exchange, type, lotSize,
                                  tickSize, currentPrice, open, high, low, previousClose,
                                  change, changePercent, volume, marketCap, isEnabled,
                                  lastUpdated)
              VALUES (
                ${data.id || crypto.randomUUID()},
                ${data.symbol},
                ${data.name},
                ${data.sector},
                ${data.exchange || 'NSE'},
                ${data.type},
                ${data.lotSize},
                ${data.tickSize || 0.05},
                ${data.currentPrice},
                ${data.open},
                ${data.high},
                ${data.low},
                ${data.previousClose},
                ${data.change || 0},
                ${data.changePercent || 0},
                ${data.volume},
                ${data.marketCap},
                ${data.isEnabled !== false},
                ${new Date().toISOString()}
              )
            `
          } else {
            await db.$queryRaw`
              UPDATE stocks
              SET symbol = ${data.symbol},
                  name = ${data.name},
                  sector = ${data.sector},
                  exchange = ${data.exchange},
                  type = ${data.type},
                  lotSize = ${data.lotSize},
                  tickSize = ${data.tickSize},
                  currentPrice = ${data.currentPrice},
                  open = ${data.open},
                  high = ${data.high},
                  low = ${data.low},
                  previousClose = ${data.previousClose},
                  change = ${data.change || 0},
                  changePercent = ${data.changePercent || 0},
                  volume = ${data.volume},
                  marketCap = ${data.marketCap},
                  isEnabled = ${data.isEnabled !== false},
                  lastUpdated = ${new Date().toISOString()}
              WHERE id = ${data.id}
            `
          }
          break
        }

        case 'fnoBan': {
          if (action === 'create') {
            await db.$queryRaw`
              INSERT INTO fnoBanEntries (id, stockSymbol, stockName, stockId, banStartDate,
                                         banEndDate, reason, isActive, createdAt, updatedAt)
              VALUES (
                ${data.id || crypto.randomUUID()},
                ${data.stockSymbol},
                ${data.stockName},
                ${data.stockId},
                ${data.banStartDate},
                ${data.banEndDate},
                ${data.reason},
                ${data.isActive !== false},
                ${new Date().toISOString()},
                ${new Date().toISOString()}
              )
            `
          } else {
            await db.$queryRaw`
              UPDATE fnoBanEntries
              SET stockSymbol = ${data.stockSymbol},
                  stockName = ${data.stockName},
                  stockId = ${data.stockId},
                  banStartDate = ${data.banStartDate},
                  banEndDate = ${data.banEndDate},
                  reason = ${data.reason},
                  isActive = ${data.isActive !== false},
                  updatedAt = ${new Date().toISOString()}
              WHERE id = ${data.id}
            `
          }
          break
        }

        case 'holiday': {
          if (action === 'create') {
            await db.$queryRaw`
              INSERT INTO marketHolidays (id, name, date, isMuhurat, muhuratStart,
                                          muhuratEnd, createdAt)
              VALUES (
                ${data.id || crypto.randomUUID()},
                ${data.name},
                ${data.date},
                ${data.isMuhurat || false},
                ${data.muhuratStart},
                ${data.muhuratEnd},
                ${new Date().toISOString()}
              )
            `
          } else {
            await db.$queryRaw`
              UPDATE marketHolidays
              SET name = ${data.name},
                  date = ${data.date},
                  isMuhurat = ${data.isMuhurat || false},
                  muhuratStart = ${data.muhuratStart},
                  muhuratEnd = ${data.muhuratEnd}
              WHERE id = ${data.id}
            `
          }
          break
        }

        default:
          return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: `${type} ${action}d successfully` })
    }

    if (action === 'toggleStatus') {
      const { id, type, isEnabled } = data

      switch (type) {
        case 'index':
          await db.$queryRaw`
            UPDATE indices
            SET isEnabled = ${isEnabled}, lastUpdated = ${new Date().toISOString()}
            WHERE id = ${id}
          `
          break
        case 'stock':
          await db.$queryRaw`
            UPDATE stocks
            SET isEnabled = ${isEnabled}, lastUpdated = ${new Date().toISOString()}
            WHERE id = ${id}
          `
          break
        default:
          return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Status updated successfully' })
    }

    if (action === 'markFnoBan') {
      const { stockId, stockSymbol, stockName, banStartDate, banEndDate, reason } = data

      await db.$queryRaw`
        INSERT INTO fnoBanEntries (id, stockSymbol, stockName, stockId, banStartDate,
                                   banEndDate, reason, isActive, createdAt, updatedAt)
        VALUES (
          ${crypto.randomUUID()},
          ${stockSymbol},
          ${stockName},
          ${stockId},
          ${banStartDate},
          ${banEndDate},
          ${reason},
          true,
          ${new Date().toISOString()},
          ${new Date().toISOString()}
        )
      `

      return NextResponse.json({ success: true, message: 'Stock marked for F&O ban' })
    }

    if (action === 'removeFnoBan') {
      await db.$queryRaw`
        DELETE FROM fnoBanEntries WHERE id = ${data.id}
      `

      return NextResponse.json({ success: true, message: 'F&O ban removed' })
    }

    if (action === 'deleteHoliday') {
      await db.$queryRaw`
        DELETE FROM marketHolidays WHERE id = ${data.id}
      `

      return NextResponse.json({ success: true, message: 'Holiday deleted' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Market API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}