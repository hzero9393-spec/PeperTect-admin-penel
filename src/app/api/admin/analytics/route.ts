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
    const period = searchParams.get('period') || '30d'

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    const endDate = now

    if (period === '7d') {
      startDate.setDate(now.getDate() - 7)
    } else if (period === '30d') {
      startDate.setDate(now.getDate() - 30)
    } else if (period === '90d') {
      startDate.setDate(now.getDate() - 90)
    } else if (period === '1y') {
      startDate.setFullYear(now.getFullYear() - 1)
    }

    // ============================================
    // USER ANALYTICS
    // ============================================

    // User registrations over time (monthly)
    const userRegistrations = await db.$queryRaw`
      SELECT
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as count
      FROM users
      WHERE createdAt >= ${startDate}
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month
    ` as any[]

    // Active users (DAU/MAU)
    const dailyActiveUsers = await db.$queryRaw`
      SELECT COUNT(DISTINCT userId) as count
      FROM trades
      WHERE createdAt >= date('now', '-1 day')
    ` as any[]

    const monthlyActiveUsers = await db.$queryRaw`
      SELECT COUNT(DISTINCT userId) as count
      FROM trades
      WHERE createdAt >= date('now', '-30 days')
    ` as any[]

    // User distribution by subscription
    const subscriptionDistribution = await db.$queryRaw`
      SELECT
        planType,
        COUNT(*) as count
      FROM subscriptionTransactions
      WHERE status = 'SUCCESS'
        AND expiresAt > ${now}
      GROUP BY planType
    ` as any[]

    // ============================================
    // TRADING ANALYTICS
    // ============================================

    // Trade volume over time (daily)
    const tradeVolumeData = await db.$queryRaw`
      SELECT
        strftime('%Y-%m-%d', createdAt) as date,
        SUM(totalValue) as totalVolume,
        COUNT(*) as tradeCount
      FROM trades
      WHERE createdAt >= ${startDate}
      GROUP BY strftime('%Y-%m-%d', createdAt)
      ORDER BY date
      LIMIT 30
    ` as any[]

    // Popular stocks by volume (top 10)
    const popularStocks = await db.$queryRaw`
      SELECT
        s.symbol,
        s.name,
        COUNT(t.id) as tradeCount,
        SUM(t.totalValue) as totalVolume,
        AVG(t.quantity) as avgQuantity
      FROM trades t
      JOIN stocks s ON t.stockId = s.id
      WHERE t.createdAt >= ${startDate}
      GROUP BY t.stockId
      ORDER BY totalVolume DESC
      LIMIT 10
    ` as any[]

    // Average trade size by segment
    const avgTradeSizeBySegment = await db.$queryRaw`
      SELECT
        CASE
          WHEN totalValue < 10000 THEN 'Small (< ₹10K)'
          WHEN totalValue < 50000 THEN 'Medium (₹10K-50K)'
          WHEN totalValue < 100000 THEN 'Large (₹50K-100K)'
          ELSE 'X-Large (> ₹100K)'
        END as segment,
        AVG(totalValue) as avgValue,
        COUNT(*) as count
      FROM trades
      WHERE createdAt >= ${startDate}
      GROUP BY segment
      ORDER BY avgValue
    ` as any[]

    // ============================================
    // REVENUE ANALYTICS
    // ============================================

    // Revenue trends (monthly)
    const revenueTrends = await db.$queryRaw`
      SELECT
        strftime('%Y-%m', createdAt) as month,
        SUM(amount) as totalRevenue,
        COUNT(*) as transactionCount
      FROM subscriptionTransactions
      WHERE status = 'SUCCESS'
        AND createdAt >= ${startDate}
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month
    ` as any[]

    // Conversion funnel data
    const totalSignups = await db.$queryRaw`
      SELECT COUNT(*) as count
      FROM users
      WHERE createdAt >= ${startDate}
    ` as any[]

    const premiumUsers = await db.$queryRaw`
      SELECT COUNT(DISTINCT userId) as count
      FROM subscriptionTransactions
      WHERE planType IN ('PREMIUM', 'PRO')
        AND status = 'SUCCESS'
        AND createdAt >= ${startDate}
    ` as any[]

    const activeTraders = await db.$queryRaw`
      SELECT COUNT(DISTINCT userId) as count
      FROM trades
      WHERE createdAt >= ${startDate}
    ` as any[]

    const powerUsers = await db.$queryRaw`
      SELECT COUNT(DISTINCT userId) as count
      FROM trades
      WHERE createdAt >= ${startDate}
      GROUP BY userId
      HAVING COUNT(*) >= 10
    ` as any[]

    // Monthly revenue breakdown
    const monthlyRevenueBreakdown = await db.$queryRaw`
      SELECT
        strftime('%Y-%m', st.createdAt) as month,
        st.planType,
        SUM(st.amount) as totalRevenue,
        COUNT(*) as subscriptionCount
      FROM subscriptionTransactions st
      WHERE st.status = 'SUCCESS'
        AND st.createdAt >= ${startDate}
      GROUP BY strftime('%Y-%m', st.createdAt), st.planType
      ORDER BY month, st.planType
    ` as any[]

    return NextResponse.json({
      success: true,
      data: {
        userAnalytics: {
          registrationsOverTime: userRegistrations,
          activeUsers: {
            dau: dailyActiveUsers[0]?.count || 0,
            mau: monthlyActiveUsers[0]?.count || 0,
            ratio: monthlyActiveUsers[0]?.count > 0
              ? ((dailyActiveUsers[0]?.count || 0) / monthlyActiveUsers[0]?.count * 100).toFixed(2)
              : '0'
          },
          subscriptionDistribution: subscriptionDistribution
        },
        tradingAnalytics: {
          volumeTrends: tradeVolumeData,
          popularStocks: popularStocks,
          avgTradeSizeBySegment: avgTradeSizeBySegment
        },
        revenueAnalytics: {
          revenueTrends: revenueTrends,
          conversionFunnel: {
            signups: totalSignups[0]?.count || 0,
            premium: premiumUsers[0]?.count || 0,
            active: activeTraders[0]?.count || 0,
            powerUsers: powerUsers.length || 0
          },
          monthlyBreakdown: monthlyRevenueBreakdown
        }
      }
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}