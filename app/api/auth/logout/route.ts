import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    await logout()

    const response = NextResponse.json({ success: true })
    
    // Hapus cookie dengan path dan options yang sama dengan saat dibuat
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Set ke 0 untuk menghapus cookie
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

