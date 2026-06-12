import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// GET /api/admin/users - Fetch users with pagination, search, filters, and sorting
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
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const subscription = searchParams.get('subscription') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'DESC'

    const offset = (page - 1) * limit

    // Build WHERE clause conditions
    const conditions = []
    const params: any[] = []

    if (search) {
      conditions.push(`(name LIKE ? OR email LIKE ? OR phone LIKE ?)`)
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (role) {
      conditions.push(`role = ?`)
      params.push(role)
    }

    if (subscription) {
      conditions.push(`subscription = ?`)
      params.push(subscription)
    }

    if (status === 'ACTIVE') {
      conditions.push(`isActive = 1`)
    } else if (status === 'INACTIVE') {
      conditions.push(`isActive = 0`)
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `

    const totalResult = await db.$queryRawUnsafe(countQuery, ...params) as any[]
    const total = totalResult[0]?.total || 0

    // Get paginated users with P&L calculation
    const usersQuery = `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        subscription,
        status,
        isActive,
        cashBalance,
        isEmailVerified,
        lastLoginAt,
        createdAt,
        updatedAt
      FROM users
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `

    const users = await db.$queryRawUnsafe(usersQuery, ...params, limit, offset) as any[]

    // Calculate P&L for each user (sum of trade P&L)
    const usersWithPnL = await Promise.all(
      users.map(async (user) => {
        const pnlResult = await db.$queryRaw`
          SELECT COALESCE(SUM(pnl), 0) as totalPnL
          FROM trades
          WHERE userId = ${user.id}
        ` as any[]

        const totalPnL = pnlResult[0]?.totalPnL || 0

        return {
          ...user,
          totalPnL: Number(totalPnL),
          isActive: user.isActive === 1,
          isEmailVerified: user.isEmailVerified === 1,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithPnL,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users - Update user details
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
    const { id, name, email, phone, role, subscription, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Build update query dynamically
    const updates: string[] = []
    const params: any[] = []

    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (email !== undefined) {
      updates.push('email = ?')
      params.push(email)
    }
    if (phone !== undefined) {
      updates.push('phone = ?')
      params.push(phone)
    }
    if (role !== undefined) {
      updates.push('role = ?')
      params.push(role)
    }
    if (subscription !== undefined) {
      updates.push('subscription = ?')
      params.push(subscription)
    }
    if (isActive !== undefined) {
      updates.push('isActive = ?')
      params.push(isActive ? 1 : 0)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    params.push(id)

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}, updatedAt = datetime('now')
      WHERE id = ?
    `

    await db.$queryRawUnsafe(updateQuery, ...params)

    // Get updated user
    const updatedUsers = await db.$queryRaw`
      SELECT id, name, email, phone, role, subscription, status, isActive, cashBalance,
             isEmailVerified, lastLoginAt, createdAt, updatedAt
      FROM users
      WHERE id = ${id}
    ` as any[]

    if (!updatedUsers || updatedUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = updatedUsers[0]

    // Calculate P&L
    const pnlResult = await db.$queryRaw`
      SELECT COALESCE(SUM(pnl), 0) as totalPnL
      FROM trades
      WHERE userId = ${user.id}
    ` as any[]

    const totalPnL = pnlResult[0]?.totalPnL || 0

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        totalPnL: Number(totalPnL),
        isActive: user.isActive === 1,
        isEmailVerified: user.isEmailVerified === 1,
      },
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users - Delete user
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = req.nextUrl
    const id = searchParams.get('id')
    const confirmation = searchParams.get('confirmation')

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Invalid confirmation. Type DELETE to confirm.' },
        { status: 400 }
      )
    }

    // Delete user (cascade will handle related records)
    await db.$queryRaw`DELETE FROM users WHERE id = ${id}`

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}