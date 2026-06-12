import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs"
import { cookies } from 'next/headers'
import { getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// GET /api/admin/settings - Fetch platform settings
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

    // Get platform settings
    const settings = await db.$queryRaw`
      SELECT * FROM platformSettings
    ` as any[]

    // Get recent activity logs
    const activityLogs = await db.$queryRaw`
      SELECT
        al.id, al.action, al.targetId, al.details, al.ipAddress, al.createdAt,
        a.name as adminName
      FROM activityLogs al
      LEFT JOIN admins a ON al.adminId = a.id
      ORDER BY al.createdAt DESC
      LIMIT 50
    ` as any[]

    // Get all admins
    const admins = await db.$queryRaw`
      SELECT id, username, name, email, role, isActive, lastLoginAt, createdAt
      FROM admins
      ORDER BY createdAt DESC
    ` as any[]

    return NextResponse.json({
      success: true,
      data: {
        settings,
        activityLogs,
        admins,
      },
    })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings - Update platform settings
export async function PUT(req: NextRequest) {
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
    const { id, value } = body

    if (!id || value === undefined) {
      return NextResponse.json(
        { error: 'id and value are required' },
        { status: 400 }
      )
    }

    // Update setting
    await db.$queryRaw`
      UPDATE platformSettings
      SET value = ${value}, updatedAt = datetime('now')
      WHERE id = ${id}
    `

    // Log activity
    await db.$queryRaw`
      INSERT INTO activityLogs (adminId, action, targetId, details, ipAddress, createdAt)
      VALUES (${admin.id}, 'UPDATE_SETTING', ${id}, ${`Updated setting to: ${value}`}, '', datetime('now'))
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}