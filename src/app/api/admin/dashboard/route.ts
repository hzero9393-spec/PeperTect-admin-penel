import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = await getAdminFromToken(token)
    if (!admin) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get dashboard stats
    const stats = await Promise.all([
      db.$queryRaw`SELECT COUNT(*) as count FROM users` as any[],
      db.$queryRaw`SELECT COUNT(*) as count FROM users WHERE isActive = true` as any[],
      db.$queryRaw`SELECT COUNT(*) as count FROM users WHERE subscription = 'PREMIUM'` as any[],
      db.$queryRaw`SELECT SUM(amount) as total FROM subscription_transactions WHERE status = 'SUCCESS'` as any[],
      db.$queryRaw`SELECT COUNT(*) as count FROM positions WHERE quantity > 0` as any[],
      db.$queryRaw`SELECT COUNT(*) as count FROM orders WHERE status = 'PENDING'` as any[],
    ])

    // Get recent users
    const recentUsers = await db.$queryRaw`
      SELECT id, name, email, subscription, createdAt
      FROM users
      ORDER BY createdAt DESC
      LIMIT 10
    ` as any[]

    // Get recent trades
    const recentTrades = await db.$queryRaw`
      SELECT
        t.id, t.userId, t.symbol, t.tradeDirection, t.quantity, t.fillPrice,
        t.totalValue, t.pnl, t.executedAt, u.name as userName
      FROM trades t
      LEFT JOIN users u ON t.userId = u.id
      ORDER BY t.executedAt DESC
      LIMIT 10
    ` as any[]

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers: stats[0]?.[0]?.count || 0,
          activeUsers: stats[1]?.[0]?.count || 0,
          premiumUsers: stats[2]?.[0]?.count || 0,
          totalRevenue: stats[3]?.[0]?.total || 0,
          activePositions: stats[4]?.[0]?.count || 0,
          openOrders: stats[5]?.[0]?.count || 0,
        },
        recentUsers,
        recentTrades,
      },
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}