import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

// GET - Get teaching sessions for current user (or all for admin)
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        // Admin sees all sessions, Guru sees only their own
        const whereClause = user.role === 'admin' ? {} : { userId: user.id }

        const sessions = await prisma.teachingSession.findMany({
            where: whereClause,
            orderBy: { startedAt: 'desc' },
            take: limit,
            include: {
                lab: {
                    select: { name: true, description: true }
                },
                user: {
                    select: { name: true, username: true }
                }
            }
        })

        // Calculate stats
        const totalSessions = await prisma.teachingSession.count({
            where: whereClause
        })

        const totalMinutes = await prisma.teachingSession.aggregate({
            where: { ...whereClause, duration: { not: null } },
            _sum: { duration: true }
        })

        return NextResponse.json({
            success: true,
            data: sessions,
            stats: {
                totalSessions,
                totalMinutes: totalMinutes._sum.duration || 0
            }
        })
    } catch (error) {
        console.error('Error fetching teaching sessions:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Start a new teaching session
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { labId, labName, scheduledEndTime } = body

        if (!labId || !labName) {
            return NextResponse.json({ success: false, error: 'Lab ID and name required' }, { status: 400 })
        }

        if (!scheduledEndTime) {
            return NextResponse.json({ success: false, error: 'Waktu berakhir harus ditentukan' }, { status: 400 })
        }

        // Check how many active sessions in this lab (max 2)
        const activeSessionsInLab = await prisma.teachingSession.findMany({
            where: {
                labId,
                endedAt: null
            },
            include: {
                user: { select: { name: true, username: true } }
            }
        })

        if (activeSessionsInLab.length >= 2) {
            const teachers = activeSessionsInLab.map(s => s.user?.name || s.user?.username).join(', ')
            return NextResponse.json({
                success: false,
                error: `Lab sudah penuh (maks 2 guru). Guru aktif: ${teachers}`
            }, { status: 400 })
        }

        // End any existing active session for this user
        const existingSession = await prisma.teachingSession.findFirst({
            where: { userId: user.id, endedAt: null }
        })

        if (existingSession) {
            const endedAt = new Date()
            const duration = Math.round((endedAt.getTime() - existingSession.startedAt.getTime()) / 60000)
            await prisma.teachingSession.update({
                where: { id: existingSession.id },
                data: { endedAt, duration }
            })
        }

        const session = await prisma.teachingSession.create({
            data: {
                userId: user.id,
                labId,
                labName,
                startedAt: new Date(),
                scheduledEndTime: new Date(scheduledEndTime)
            }
        })

        return NextResponse.json({ success: true, data: session })
    } catch (error) {
        console.error('Error creating teaching session:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH - End current teaching session
export async function PATCH(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { notes } = body

        // Find active session
        const activeSession = await prisma.teachingSession.findFirst({
            where: { userId: user.id, endedAt: null },
            orderBy: { startedAt: 'desc' }
        })

        if (!activeSession) {
            return NextResponse.json({ success: false, error: 'No active session found' }, { status: 404 })
        }

        const endedAt = new Date()
        const duration = Math.round((endedAt.getTime() - activeSession.startedAt.getTime()) / 60000)

        const updatedSession = await prisma.teachingSession.update({
            where: { id: activeSession.id },
            data: {
                endedAt,
                duration,
                notes: notes || null
            }
        })

        return NextResponse.json({ success: true, data: updatedSession })
    } catch (error) {
        console.error('Error ending teaching session:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
