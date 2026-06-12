import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs"
import { cookies } from 'next/headers'
import { getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// GET /api/admin/challenges/participations?challengeId=xxx - Fetch participations for a challenge
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

    const { searchParams } = req.nextUrl
    const challengeId = searchParams.get('challengeId')

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      )
    }

    const participations = await db.$queryRaw`
      SELECT
        cp.*,
        u.name as userName,
        u.email as userEmail
      FROM challengeParticipations cp
      LEFT JOIN users u ON cp.userId = u.id
      WHERE cp.challengeId = ${challengeId}
      ORDER BY cp.joinedAt DESC
    ` as any[]

    return NextResponse.json({
      success: true,
      data: participations,
    })
  } catch (error) {
    console.error('Challenge participations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}