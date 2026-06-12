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

    // Get current date and date 7 days from now
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Active subscriptions (status = SUCCESS and expiresAt > now)
    const activeSubscriptions = await db.$queryRaw`
      SELECT
        st.id,
        st.userId,
        u.email as userEmail,
        u.name as userName,
        st.planType,
        st.amount,
        st.startedAt,
        st.expiresAt,
        st.createdAt
      FROM subscriptionTransactions st
      LEFT JOIN users u ON st.userId = u.id
      WHERE st.status = 'SUCCESS' AND st.expiresAt > ${now}
      ORDER BY st.expiresAt DESC
    ` as any[]

    // Expiring soon (7 days)
    const expiringSoon = activeSubscriptions.filter(
      (sub) => new Date(sub.expiresAt) <= sevenDaysFromNow
    )

    // Total revenue (all successful transactions)
    const totalRevenueResult = await db.$queryRaw`
      SELECT SUM(amount) as total
      FROM subscriptionTransactions
      WHERE status = 'SUCCESS'
    ` as any[]

    const totalRevenue = totalRevenueResult[0]?.total || 0

    // MRR (Monthly Recurring Revenue) - sum of all active subscriptions
    const mrr = activeSubscriptions.reduce((sum: number, sub: any) => sum + (sub.amount || 0), 0)

    // Churn rate calculation
    // Churned subscriptions (expired in current month) / Active subscriptions at start of month
    const churnedSubscriptions = await db.$queryRaw`
      SELECT COUNT(*) as count
      FROM subscriptionTransactions
      WHERE status = 'SUCCESS' AND expiresAt >= ${firstDayOfMonth} AND expiresAt < ${now}
    ` as any[]

    const churnedCount = churnedSubscriptions[0]?.count || 0
    const activeCountStartMonth = await db.$queryRaw`
      SELECT COUNT(DISTINCT userId) as count
      FROM subscriptionTransactions
      WHERE status = 'SUCCESS' AND startedAt < ${firstDayOfMonth}
    ` as any[]

    const activeStartMonth = activeCountStartMonth[0]?.count || 0
    const churnRate = activeStartMonth > 0 ? (churnedCount / activeStartMonth) * 100 : 0

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

      const monthRevenue = await db.$queryRaw`
        SELECT SUM(amount) as total, COUNT(*) as count
        FROM subscriptionTransactions
        WHERE status = 'SUCCESS' AND createdAt >= ${monthStart} AND createdAt <= ${monthEnd}
      ` as any[]

      const monthName = monthStart.toLocaleString('default', { month: 'short' })
      monthlyRevenue.push({
        month: monthName,
        revenue: monthRevenue[0]?.total || 0,
        subscriptions: monthRevenue[0]?.count || 0,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        activeSubscriptions,
        expiringSoon,
        stats: {
          activeSubscriptions: activeSubscriptions.length,
          expiringSoon: expiringSoon.length,
          mrr,
          totalRevenue,
          churnRate,
        },
        monthlyRevenue,
      },
    })
  } catch (error) {
    console.error('Subscriptions API error:', error)
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
    const { userEmail, planType } = body

    if (!userEmail || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields: userEmail, planType' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.$queryRaw`
      SELECT id, name, email
      FROM users
      WHERE email = ${userEmail}
    ` as any[]

    if (!user || user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user[0].id

    // Determine amount based on plan
    let amount = 0
    if (planType === 'PREMIUM') {
      amount = 999
    } else if (planType === 'PRO') {
      amount = 1999
    }

    // Calculate expiration date (30 days from now)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Create subscription transaction
    await db.$queryRaw`
      INSERT INTO subscriptionTransactions (id, userId, amount, currency, status, planType, startedAt, expiresAt, createdAt)
      VALUES (lower(hex(randomblob(16))), ${userId}, ${amount}, 'INR', 'SUCCESS', ${planType}, ${now}, ${expiresAt}, ${now})
    `

    // Update user's subscription
    await db.$queryRaw`
      UPDATE users
      SET subscription = ${planType}
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: 'Subscription granted successfully',
    })
  } catch (error) {
    console.error('Grant subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}