import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminToken, getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST /api/admin/auth/login - Login admin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Get admin from database
    const admins = await db.$queryRaw`
      SELECT * FROM admins
      WHERE username = ${username} AND isActive = true
    ` as any[]

    if (!admins || admins.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const admin = admins[0]

    // Verify password
    const isPasswordValid = await bcrypt.verify(password, admin.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    await db.$queryRaw`
      UPDATE admins
      SET lastLoginAt = datetime('now')
      WHERE id = ${admin.id}
    `

    // Create JWT token
    const token = await createAdminToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    })

    // Set httpOnly cookie
    cookies().set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/auth/me - Get current admin
export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const admin = await getAdminFromToken(token)
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('Get admin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/auth/logout - Logout admin
export async function DELETE(req: NextRequest) {
  try {
    cookies().delete('admin-token')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}