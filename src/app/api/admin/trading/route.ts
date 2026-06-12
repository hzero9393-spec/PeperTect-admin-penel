import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs"
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

    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const symbol = searchParams.get('symbol')
    const segment = searchParams.get('segment') // EQUITY, FUTURES, OPTIONS
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build base queries
    let positionsQuery = `
      SELECT
        p.id, p.userId, p.stockId, p.quantity, p.avgPrice, p.currentPrice,
        p.totalValue, p.unrealizedPnl, p.unrealizedPnlPercent, p.dayChange,
        p.dayChangePercent, p.type, p.createdAt, p.updatedAt,
        u.name as userName, u.email as userEmail,
        s.symbol as stockSymbol, s.name as stockName, s.type as stockType, s.exchange
      FROM positions p
      LEFT JOIN users u ON p.userId = u.id
      LEFT JOIN stocks s ON p.stockId = s.id
      WHERE p.quantity != 0
    `

    let ordersQuery = `
      SELECT
        o.id, o.userId, o.stockId, o.orderType, o.tradeType, o.quantity,
        o.price, o.stopPrice, o.filledQuantity, o.status, o.reason,
        o.createdAt, o.updatedAt, o.filledAt, o.cancelledAt,
        u.name as userName, u.email as userEmail,
        s.symbol as stockSymbol, s.name as stockName, s.type as stockType, s.exchange
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      LEFT JOIN stocks s ON o.stockId = s.id
      WHERE 1=1
    `

    let tradesQuery = `
      SELECT
        t.id, t.userId, t.stockId, t.orderId, t.tradeType, t.quantity,
        t.price as fillPrice, t.totalValue, t.pnl, t.pnlPercent, t.brokerage,
        t.tax, t.transactionType, t.createdAt, t.updatedAt,
        u.name as userName, u.email as userEmail,
        s.symbol as stockSymbol, s.name as stockName, s.type as stockType, s.exchange
      FROM trades t
      LEFT JOIN users u ON t.userId = u.id
      LEFT JOIN stocks s ON t.stockId = s.id
      WHERE 1=1
    `

    // Apply filters
    const params: any[] = []

    if (userId) {
      positionsQuery += ` AND p.userId = ?`
      ordersQuery += ` AND o.userId = ?`
      tradesQuery += ` AND t.userId = ?`
      params.push(userId, userId, userId)
    }

    if (symbol) {
      const symbolUpper = symbol.toUpperCase()
      positionsQuery += ` AND s.symbol LIKE ?`
      ordersQuery += ` AND s.symbol LIKE ?`
      tradesQuery += ` AND s.symbol LIKE ?`
      params.push(`%${symbolUpper}%`, `%${symbolUpper}%`, `%${symbolUpper}%`)
    }

    if (segment) {
      positionsQuery += ` AND s.type = ?`
      ordersQuery += ` AND s.type = ?`
      tradesQuery += ` AND s.type = ?`
      params.push(segment, segment, segment)
    }

    if (status) {
      ordersQuery += ` AND o.status = ?`
      params.push(status)
    }

    if (startDate && endDate) {
      positionsQuery += ` AND p.createdAt >= ? AND p.createdAt <= ?`
      ordersQuery += ` AND o.createdAt >= ? AND o.createdAt <= ?`
      tradesQuery += ` AND t.createdAt >= ? AND t.createdAt <= ?`
      params.push(startDate, endDate, startDate, endDate, startDate, endDate)
    } else if (startDate) {
      positionsQuery += ` AND p.createdAt >= ?`
      ordersQuery += ` AND o.createdAt >= ?`
      tradesQuery += ` AND t.createdAt >= ?`
      params.push(startDate, startDate, startDate)
    } else if (endDate) {
      positionsQuery += ` AND p.createdAt <= ?`
      ordersQuery += ` AND o.createdAt <= ?`
      tradesQuery += ` AND t.createdAt <= ?`
      params.push(endDate, endDate, endDate)
    }

    // Add order by
    positionsQuery += ` ORDER BY p.updatedAt DESC`
    ordersQuery += ` ORDER BY o.createdAt DESC`
    tradesQuery += ` ORDER BY t.createdAt DESC`

    // Execute queries
    const [positions, orders, trades] = await Promise.all([
      db.$queryRawUnsafe(positionsQuery, ...params.slice(0, params.length / 3)),
      db.$queryRawUnsafe(ordersQuery, ...params.slice(params.length / 3, 2 * params.length / 3)),
      db.$queryRawUnsafe(tradesQuery, ...params.slice(2 * params.length / 3)),
    ])

    return NextResponse.json({
      success: true,
      data: {
        positions: positions || [],
        orders: orders || [],
        trades: trades || [],
      },
    })
  } catch (error) {
    console.error('Trading API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}