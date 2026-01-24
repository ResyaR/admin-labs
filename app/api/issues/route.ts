import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

// GET - Get issue reports
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const labId = searchParams.get('labId')

        let whereClause: any = {}

        // If not admin, only show user's own reports
        if (user.role !== 'admin') {
            whereClause.reporterId = user.id
        }

        if (status && status !== 'all') {
            whereClause.status = status
        }

        if (labId) {
            whereClause.labId = labId
        }

        const reports = await prisma.issueReport.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: {
                    select: { name: true, username: true }
                },
                lab: {
                    select: { name: true }
                }
            }
        })

        // Get counts by status
        const statusCounts = await prisma.issueReport.groupBy({
            by: ['status'],
            where: user.role !== 'admin' ? { reporterId: user.id } : {},
            _count: true
        })

        return NextResponse.json({
            success: true,
            data: reports,
            counts: statusCounts.reduce((acc, item) => {
                acc[item.status] = item._count
                return acc
            }, {} as Record<string, number>)
        })
    } catch (error) {
        console.error('Error fetching issue reports:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new issue report
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { labId, pcId, pcHostname, category, priority, title, description } = body

        if (!labId || !category || !title || !description) {
            return NextResponse.json({
                success: false,
                error: 'Lab, category, title, and description are required'
            }, { status: 400 })
        }

        const report = await prisma.issueReport.create({
            data: {
                reporterId: user.id,
                labId,
                pcId: pcId || null,
                pcHostname: pcHostname || null,
                category,
                priority: priority || 'medium',
                title,
                description,
                status: 'open'
            }
        })

        return NextResponse.json({ success: true, data: report })
    } catch (error) {
        console.error('Error creating issue report:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH - Update issue report status (Admin only)
export async function PATCH(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, status, resolution } = body

        if (!id || !status) {
            return NextResponse.json({ success: false, error: 'Report ID and status required' }, { status: 400 })
        }

        const updateData: any = { status }

        if (status === 'resolved' || status === 'closed') {
            updateData.resolvedAt = new Date()
            updateData.resolvedBy = user.id
            if (resolution) updateData.resolution = resolution
        }

        const report = await prisma.issueReport.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({ success: true, data: report })
    } catch (error) {
        console.error('Error updating issue report:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
