import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs"
import { cookies } from 'next/headers'
import { getAdminFromToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// GET /api/admin/challenges - Fetch all challenges with participations count
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

    const challenges = await db.$queryRaw`
      SELECT
        c.*,
        (SELECT COUNT(*) FROM challengeParticipations cp WHERE cp.challengeId = c.id) as participationsCount
      FROM challenges c
      ORDER BY c.createdAt DESC
    ` as any[]

    return NextResponse.json({
      success: true,
      data: challenges,
    })
  } catch (error) {
    console.error('Challenges API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/challenges - Create new challenge or change status
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
    const { action, id: actionId } = body

    // Handle status change actions
    if (action && actionId) {
      let newStatus = ''

      switch (action) {
        case 'start':
          newStatus = 'ONGOING'
          break
        case 'pause':
          newStatus = 'UPCOMING'
          break
        case 'complete':
          newStatus = 'COMPLETED'
          break
        case 'cancel':
          newStatus = 'CANCELLED'
          break
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          )
      }

      await db.$queryRaw`
        UPDATE challenges
        SET status = ${newStatus}, updatedAt = datetime('now')
        WHERE id = ${actionId}
      `

      return NextResponse.json({
        success: true,
        message: `Challenge ${action}ed successfully`,
        data: { id: actionId, status: newStatus },
      })
    }

    // Create new challenge
    const {
      title,
      description,
      challengeType,
      targetMetric,
      targetValue,
      prize,
      prizeValue,
      startDate,
      endDate,
      maxParticipants,
      tier = 'FREE',
    } = body

    // Validation
    if (!title || !description || !challengeType || !targetMetric || !targetValue || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const id = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await db.$queryRaw`
      INSERT INTO challenges (
        id, title, description, challengeType, targetMetric, targetValue,
        prize, prizeValue, startDate, endDate, maxParticipants,
        currentParticipants, status, tier, createdAt, updatedAt
      )
      VALUES (
        ${id}, ${title}, ${description}, ${challengeType}, ${targetMetric}, ${targetValue},
        ${prize || null}, ${prizeValue || null}, ${startDate}, ${endDate}, ${maxParticipants || null},
        0, 'UPCOMING', ${tier}, datetime('now'), datetime('now')
      )
    `

    // Get the created challenge
    const createdChallenges = await db.$queryRaw`
      SELECT * FROM challenges WHERE id = ${id}
    ` as any[]

    const challenge = createdChallenges[0]

    return NextResponse.json({
      success: true,
      message: 'Challenge created successfully',
      data: { ...challenge, participationsCount: 0 },
    })
  } catch (error) {
    console.error('Create challenge error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/challenges - Update challenge
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
    const { id, title, description, startDate, endDate, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      )
    }

    // Build update query dynamically
    const updates: string[] = []
    const params: any[] = []

    if (title !== undefined) {
      updates.push('title = ?')
      params.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (startDate !== undefined) {
      updates.push('startDate = ?')
      params.push(startDate)
    }
    if (endDate !== undefined) {
      updates.push('endDate = ?')
      params.push(endDate)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    updates.push('updatedAt = datetime(\'now\')')
    params.push(id)

    const updateQuery = `
      UPDATE challenges
      SET ${updates.join(', ')}
      WHERE id = ?
    `

    await db.$queryRawUnsafe(updateQuery, ...params)

    // Get updated challenge with participations count
    const updatedChallenges = await db.$queryRaw`
      SELECT
        c.*,
        (SELECT COUNT(*) FROM challengeParticipations cp WHERE cp.challengeId = c.id) as participationsCount
      FROM challenges c
      WHERE c.id = ${id}
    ` as any[]

    if (!updatedChallenges || updatedChallenges.length === 0) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Challenge updated successfully',
      data: updatedChallenges[0],
    })
  } catch (error) {
    console.error('Update challenge error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}