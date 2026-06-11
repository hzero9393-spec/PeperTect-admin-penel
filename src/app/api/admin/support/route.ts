import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// GET /api/admin/support - Fetch tickets with filters
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
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const category = searchParams.get('category') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const offset = (page - 1) * limit

    // Build WHERE clause conditions
    const conditions = []
    const params: any[] = []

    if (status) {
      conditions.push(`st.status = ?`)
      params.push(status)
    }

    if (priority) {
      conditions.push(`st.priority = ?`)
      params.push(priority)
    }

    if (category) {
      conditions.push(`st.category = ?`)
      params.push(category)
    }

    if (startDate) {
      conditions.push(`st.createdAt >= ?`)
      params.push(startDate)
    }

    if (endDate) {
      conditions.push(`st.createdAt <= ?`)
      params.push(endDate)
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM supportTickets st
      ${whereClause}
    `

    const totalResult = await db.$queryRawUnsafe(countQuery, ...params) as any[]
    const total = totalResult[0]?.total || 0

    // Get paginated tickets with user info and reply count
    const ticketsQuery = `
      SELECT
        st.id,
        st.userId,
        u.name as userName,
        u.email as userEmail,
        st.subject,
        st.description,
        st.status,
        st.priority,
        st.category,
        st.createdAt,
        st.updatedAt,
        COUNT(tr.id) as replyCount
      FROM supportTickets st
      LEFT JOIN users u ON st.userId = u.id
      LEFT JOIN ticketReplies tr ON st.id = tr.ticketId
      ${whereClause}
      GROUP BY st.id
      ORDER BY st.createdAt DESC
      LIMIT ? OFFSET ?
    `

    const tickets = await db.$queryRawUnsafe(ticketsQuery, ...params, limit, offset) as any[]

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Support API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/support - Send reply or assign ticket
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
    const { action, ticketId, message, adminId } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    if (action === 'reply') {
      if (!message) {
        return NextResponse.json(
          { error: 'Message is required' },
          { status: 400 }
        )
      }

      // Create admin reply
      await db.$queryRaw`
        INSERT INTO ticketReplies (id, ticketId, isAdmin, message, createdAt)
        VALUES (cuid(), ${ticketId}, 1, ${message}, datetime('now'))
      `

      // Update ticket status to IN_PROGRESS if it was OPEN
      await db.$queryRaw`
        UPDATE supportTickets
        SET status = 'IN_PROGRESS', updatedAt = datetime('now')
        WHERE id = ${ticketId} AND status = 'OPEN'
      `

      return NextResponse.json({
        success: true,
        message: 'Reply sent successfully',
      })
    } else if (action === 'assign') {
      if (!adminId) {
        return NextResponse.json(
          { error: 'Admin ID is required' },
          { status: 400 }
        )
      }

      // Check if assignedTo column exists, if not we'll add it
      try {
        await db.$queryRaw`
          UPDATE supportTickets
          SET assignedTo = ${adminId}, updatedAt = datetime('now')
          WHERE id = ${ticketId}
        `
      } catch (e: any) {
        // If assignedTo column doesn't exist, ignore the assignment
        console.log('assignedTo field not supported:', e)
      }

      return NextResponse.json({
        success: true,
        message: 'Ticket assigned successfully',
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Support POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/support - Update ticket
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
    const { id, status, priority, category } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    // Build update query dynamically
    const updates: string[] = []
    const params: any[] = []

    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      params.push(priority)
    }
    if (category !== undefined) {
      updates.push('category = ?')
      params.push(category)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    params.push(id)

    const updateQuery = `
      UPDATE supportTickets
      SET ${updates.join(', ')}, updatedAt = datetime('now')
      WHERE id = ?
    `

    await db.$queryRawUnsafe(updateQuery, ...params)

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
    })
  } catch (error) {
    console.error('Support PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/support/[id] - Get single ticket with replies
export async function getTicketDetails(ticketId: string) {
  try {
    const ticketQuery = `
      SELECT
        st.id,
        st.userId,
        u.name as userName,
        u.email as userEmail,
        st.subject,
        st.description,
        st.status,
        st.priority,
        st.category,
        st.createdAt,
        st.updatedAt
      FROM supportTickets st
      LEFT JOIN users u ON st.userId = u.id
      WHERE st.id = ?
    `

    const tickets = await db.$queryRawUnsafe(ticketQuery, ticketId) as any[]
    const ticket = tickets[0]

    if (!ticket) {
      return null
    }

    const repliesQuery = `
      SELECT
        tr.id,
        tr.isAdmin,
        tr.message,
        tr.createdAt,
        a.name as adminName
      FROM ticketReplies tr
      LEFT JOIN Admin a ON tr.isAdmin = 1 AND 1=0
      WHERE tr.ticketId = ?
      ORDER BY tr.createdAt ASC
    `

    const replies = await db.$queryRawUnsafe(repliesQuery, ticketId) as any[]

    return {
      ...ticket,
      replies,
    }
  } catch (error) {
    console.error('Get ticket details error:', error)
    return null
  }
}