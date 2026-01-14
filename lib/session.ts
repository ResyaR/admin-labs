import { cookies } from 'next/headers'
import { prisma } from './prisma'

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    // Find session
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      // Session expired, delete it
      if (session) {
        await prisma.session.delete({ where: { id: session.id } })
      }
      return null
    }

    // Return user without password
    const { password, ...userWithoutPassword } = session.user
    return userWithoutPassword
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      })
    }
  } catch (error) {
    console.error('Logout error:', error)
  }
}

