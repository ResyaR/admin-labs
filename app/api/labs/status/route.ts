import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

// GET - Get active sessions in a specific lab
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const labId = searchParams.get('labId')

        if (!labId) {
            return NextResponse.json({ success: false, error: 'Lab ID required' }, { status: 400 })
        }

        const activeSessions = await prisma.teachingSession.findMany({
            where: {
                labId,
                endedAt: null
            },
            include: {
                user: { select: { id: true, name: true, username: true } }
            },
            orderBy: { startedAt: 'asc' }
        })

        return NextResponse.json({
            success: true,
            data: {
                count: activeSessions.length,
                maxCapacity: 2,
                isFull: activeSessions.length >= 2,
                activeTeachers: activeSessions.map(s => ({
                    id: s.user?.id,
                    name: s.user?.name || s.user?.username,
                    startedAt: s.startedAt,
                    scheduledEndTime: s.scheduledEndTime
                }))
            }
        })
    } catch (error) {
        console.error('Error fetching lab status:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
