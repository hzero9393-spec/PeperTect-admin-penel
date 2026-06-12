import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs"
import { cookies } from 'next/headers'
import { getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { hash } from 'bcryptjs'

// PUT /api/admin/profile - Update admin profile
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
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    await db.$queryRaw`
      UPDATE admins
      SET name = ${name}, email = ${email}, updatedAt = datetime('now')
      WHERE id = ${admin.id}
    `

    await db.$queryRaw`
      INSERT INTO activityLogs (adminId, action, targetId, details, ipAddress, createdAt)
      VALUES (${admin.id}, 'UPDATE_PROFILE', ${admin.id}, 'Updated profile', '', datetime('now'))
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/profile - Change password
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
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    const admins = await db.$queryRaw`
      SELECT * FROM admins WHERE id = ${admin.id}
    ` as any[]

    const currentAdmin = admins[0]
    const isPasswordValid = await bcrypt.verify(currentPassword, currentAdmin.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    const newPasswordHash = await hash(newPassword, 10)

    await db.$queryRaw`
      UPDATE admins
      SET passwordHash = ${newPasswordHash}, updatedAt = datetime('now')
      WHERE id = ${admin.id}
    `

    await db.$queryRaw`
      INSERT INTO activityLogs (adminId, action, targetId, details, ipAddress, createdAt)
      VALUES (${admin.id}, 'CHANGE_PASSWORD', ${admin.id}, 'Changed password', '', datetime('now'))
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}