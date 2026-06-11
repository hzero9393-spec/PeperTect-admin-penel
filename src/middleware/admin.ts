import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/admin-auth'

export async function adminMiddleware(req: NextRequest) {
  const token = cookies().get('admin-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  const payload = await verifyAdminToken(token)
  if (!payload) {
    cookies().delete('admin-token')
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return null
}