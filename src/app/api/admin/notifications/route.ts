import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/admin/notifications - Fetch notification history
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''

    const offset = (page - 1) * limit

    // Build WHERE clause conditions
    const conditions = []
    const params: any[] = []

    if (type) {
      conditions.push(`type = ?`)
      params.push(type)
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT campaignId) as total
      FROM notificationLogs
      ${whereClause}
    `

    const totalResult = await db.$queryRawUnsafe(countQuery, ...params) as any[]
    const total = totalResult[0]?.total || 0

    // Get notification history with aggregation
    const historyQuery = `
      SELECT
        campaignId,
        type,
        title,
        target,
        COUNT(*) as sentCount,
        SUM(CASE WHEN isRead = 1 THEN 1 ELSE 0 END) as readCount,
        MIN(createdAt) as sentAt
      FROM notificationLogs
      ${whereClause}
      GROUP BY campaignId, type, title, target
      ORDER BY sentAt DESC
      LIMIT ? OFFSET ?
    `

    const notifications = await db.$queryRawUnsafe(historyQuery, ...params, limit, offset) as any[]

    // Format the results
    const formattedNotifications = notifications.map((notif: any) => ({
      id: notif.campaignId,
      title: notif.title,
      type: notif.type,
      target: notif.target,
      sentCount: notif.sentCount,
      readCount: notif.readCount,
      sentAt: notif.sentAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/notifications - Send notification to all/specific users
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
    const { title, body: message, type, target, specificEmail } = body

    // Validate required fields
    if (!title || !message || !type || !target) {
      return NextResponse.json(
        { error: 'Title, body, type, and target are required' },
        { status: 400 }
      )
    }

    if (target === 'SPECIFIC_USER' && !specificEmail) {
      return NextResponse.json(
        { error: 'Specific user email is required when target is SPECIFIC_USER' },
        { status: 400 }
      )
    }

    // Build user query based on target
    let userQuery = 'SELECT id, email FROM users WHERE status = "ACTIVE"'
    const userParams: any[] = []

    if (target === 'PREMIUM_USERS') {
      userQuery += ' AND subscription = "PREMIUM"'
    } else if (target === 'FREE_USERS') {
      userQuery += ' AND subscription = "FREE"'
    } else if (target === 'SPECIFIC_USER') {
      userQuery += ' AND email = ?'
      userParams.push(specificEmail)
    }

    const users = await db.$queryRawUnsafe(userQuery, ...userParams) as any[]

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found for the specified target' },
        { status: 404 }
      )
    }

    // Generate campaign ID
    const campaignId = randomUUID()

    // Insert notifications for each user
    const timestamp = new Date().toISOString()
    const insertPromises = users.map((user) =>
      db.$queryRaw`
        INSERT INTO notifications (id, userId, title, body, type, isRead, isPushed, createdAt)
        VALUES (${randomUUID()}, ${user.id}, ${title}, ${message}, ${type}, 0, 0, ${timestamp})
      `
    )

    await Promise.all(insertPromises)

    // Insert notification logs for tracking
    const logPromises = users.map((user) =>
      db.$queryRaw`
        INSERT INTO notificationLogs (id, userId, type, title, body, target, campaignId, isRead, isPushed, createdAt)
        VALUES (${randomUUID()}, ${user.id}, ${type}, ${title}, ${message}, ${target}, ${campaignId}, 0, 0, ${timestamp})
      `
    )

    await Promise.all(logPromises)

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${users.length} user(s)`,
      data: {
        campaignId,
        sentCount: users.length,
        target,
      },
    })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}