import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'pepertect-admin-jwt-secret-key-2024'
)

export interface AdminTokenPayload {
  adminId: string
  username: string
  role: string
  iat: number
  exp: number
}

export async function createAdminToken(payload: Omit<AdminTokenPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
  return token
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as AdminTokenPayload
  } catch (error) {
    return null
  }
}

export async function getAdminFromToken(token: string) {
  const payload = await verifyAdminToken(token)
  if (!payload) return null

  const { db } = await import('@/lib/db')
  const admin = await db.$queryRaw`
    SELECT id, username, name, email, role, isActive, lastLoginAt, createdAt, updatedAt
    FROM admins
    WHERE id = ${payload.adminId} AND isActive = true
  ` as any[]

  if (!admin || admin.length === 0) return null

  return admin[0]
}