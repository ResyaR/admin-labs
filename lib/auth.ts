import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export interface LoginCredentials {
  username: string
  password: string
}

export async function authenticateUser(credentials: LoginCredentials) {
  try {
    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: credentials.username },
          { email: credentials.username }
        ]
      }
    })

    if (!user) {
      return { error: 'Invalid credentials', user: null }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password)

    if (!isValidPassword) {
      return { error: 'Invalid credentials', user: null }
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user
    return { error: null, user: userWithoutPassword }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed', user: null }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

