import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs"
import { cookies } from 'next/headers'
import { getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// GET /api/admin/support/[id] - Get single ticket with replies
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const ticketId = params.id

    // Get ticket details
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
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Get replies
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

    return NextResponse.json({
      success: true,
      data: {
        ...ticket,
        replies,
      },
    })
  } catch (error) {
    console.error('Get ticket details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}