import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs"
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

    // Fetch all learning paths with module count
    const learningPaths = await db.$queryRaw`
      SELECT
        lp.*,
        COUNT(DISTINCT lm.id) as modulesCount,
        COALESCE(SUM(lm.duration), 0) as totalHours
      FROM learningPaths lp
      LEFT JOIN learningModules lm ON lp.id = lm.pathId
      GROUP BY lp.id
      ORDER BY lp.order ASC, lp.createdAt DESC
    ` as any[]

    return NextResponse.json({
      success: true,
      data: learningPaths,
    })
  } catch (error) {
    console.error('Learning paths API error:', error)
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
    const { action, ...data } = body

    if (action === 'fetchModules') {
      // Fetch modules for a specific learning path
      const { pathId } = data

      if (!pathId) {
        return NextResponse.json(
          { error: 'Missing required field: pathId' },
          { status: 400 }
        )
      }

      const modules = await db.$queryRaw`
        SELECT *
        FROM learningModules
        WHERE pathId = ${pathId}
        ORDER BY \`order\` ASC, createdAt ASC
      ` as any[]

      return NextResponse.json({
        success: true,
        data: modules,
      })
    } else if (action === 'addModule') {
      // Add a new module to a learning path
      const { pathId, title, description, content, videoUrl, duration, order } = data

      if (!pathId || !title || !duration) {
        return NextResponse.json(
          { error: 'Missing required fields: pathId, title, duration' },
          { status: 400 }
        )
      }

      const now = new Date()
      const moduleId = `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await db.$queryRaw`
        INSERT INTO learningModules (id, pathId, title, description, content, videoUrl, duration, \`order\`, isActive, createdAt, updatedAt)
        VALUES (${moduleId}, ${pathId}, ${title}, ${description || ''}, ${content || ''}, ${videoUrl || null}, ${duration}, ${order || 0}, 1, ${now}, ${now})
      `

      return NextResponse.json({
        success: true,
        message: 'Module added successfully',
        data: { id: moduleId },
      })
    } else if (action === 'deleteModule') {
      // Delete a module
      const { moduleId } = data

      if (!moduleId) {
        return NextResponse.json(
          { error: 'Missing required field: moduleId' },
          { status: 400 }
        )
      }

      await db.$queryRaw`
        DELETE FROM learningModules WHERE id = ${moduleId}
      `

      return NextResponse.json({
        success: true,
        message: 'Module deleted successfully',
      })
    } else {
      // Create a new learning path
      const { title, description, category, difficulty, tier, accentColor, order } = data

      if (!title || !category || !difficulty) {
        return NextResponse.json(
          { error: 'Missing required fields: title, category, difficulty' },
          { status: 400 }
        )
      }

      const now = new Date()
      const pathId = `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await db.$queryRaw`
        INSERT INTO learningPaths (id, title, description, category, totalModules, estimatedHours, difficulty, accentColor, \`order\`, isActive, tier, createdAt, updatedAt)
        VALUES (${pathId}, ${title}, ${description || ''}, ${category}, 0, 0, ${difficulty}, ${accentColor || '#00D09C'}, ${order || 0}, 1, ${tier || 'FREE'}, ${now}, ${now})
      `

      return NextResponse.json({
        success: true,
        message: 'Learning path created successfully',
        data: { id: pathId },
      })
    }
  } catch (error) {
    console.error('Learning paths API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { action, ...data } = body

    if (action === 'updateModule') {
      // Update a module
      const { moduleId, title, description, content, videoUrl, duration, order, isActive } = data

      if (!moduleId) {
        return NextResponse.json(
          { error: 'Missing required field: moduleId' },
          { status: 400 }
        )
      }

      const now = new Date()
      await db.$queryRaw`
        UPDATE learningModules
        SET
          title = COALESCE(${title}, title),
          description = COALESCE(${description}, description),
          content = COALESCE(${content}, content),
          videoUrl = COALESCE(${videoUrl}, videoUrl),
          duration = COALESCE(${duration}, duration),
          \`order\` = COALESCE(${order}, \`order\`),
          isActive = COALESCE(${isActive}, isActive),
          updatedAt = ${now}
        WHERE id = ${moduleId}
      `

      return NextResponse.json({
        success: true,
        message: 'Module updated successfully',
      })
    } else {
      // Update a learning path
      const { id, title, description, category, difficulty, tier, accentColor, order, isActive } = data

      if (!id) {
        return NextResponse.json(
          { error: 'Missing required field: id' },
          { status: 400 }
        )
      }

      const now = new Date()
      await db.$queryRaw`
        UPDATE learningPaths
        SET
          title = COALESCE(${title}, title),
          description = COALESCE(${description}, description),
          category = COALESCE(${category}, category),
          difficulty = COALESCE(${difficulty}, difficulty),
          tier = COALESCE(${tier}, tier),
          accentColor = COALESCE(${accentColor}, accentColor),
          \`order\` = COALESCE(${order}, \`order\`),
          isActive = COALESCE(${isActive}, isActive),
          updatedAt = ${now}
        WHERE id = ${id}
      `

      return NextResponse.json({
        success: true,
        message: 'Learning path updated successfully',
      })
    }
  } catch (error) {
    console.error('Learning paths API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      )
    }

    // Delete the learning path (cascades to modules via foreign key)
    await db.$queryRaw`
      DELETE FROM learningPaths WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: 'Learning path deleted successfully',
    })
  } catch (error) {
    console.error('Learning paths API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}