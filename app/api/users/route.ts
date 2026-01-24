import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            }
        })

        return NextResponse.json({ success: true, data: users })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { username, password, name, email, role } = body

        if (!username || !password) {
            return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 })
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { username } })
        if (existing) {
            return NextResponse.json({ success: false, error: 'Username already exists' }, { status: 400 })
        }

        if (email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } })
            if (existingEmail) {
                return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 })
            }
        }

        const hashedPassword = await hashPassword(password)

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name: name || null,
                email: email || null,
                role: role || 'guru',
            },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            }
        })

        return NextResponse.json({ success: true, user: newUser })
    } catch (error) {
        console.error('Create user error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}


export async function PATCH(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, name, email, role, password } = body

        if (!id) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
        }

        const updateData: any = {
            name: name || null,
            email: email || null,
            role: role,
        }

        if (password) {
            updateData.password = await hashPassword(password)
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            }
        })

        return NextResponse.json({ success: true, user: updatedUser })
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
        }

        const targetUser = await prisma.user.findUnique({ where: { id } })
        if (!targetUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
        }

        // Prevent deleting admin users OR Prevent deleting self (depending on interpretation)
        // "admin tidak bisa menghapus admin" -> user.role === 'admin' cannot be deleted by anyone (since only admin can call this)
        if (targetUser.role === 'admin') {
            return NextResponse.json({ success: false, error: 'Cannot delete an admin user' }, { status: 403 })
        }

        await prisma.user.delete({ where: { id } })

        return NextResponse.json({ success: true, message: 'User deleted' })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
