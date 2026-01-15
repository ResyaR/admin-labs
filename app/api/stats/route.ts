import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const [totalPCs, activePCs, maintenancePCs, offlinePCs, osBreakdown, locationBreakdown, recentChanges] = await Promise.all([
            prisma.pC.count(),
            prisma.pC.count({ where: { status: 'active' } }),
            prisma.pC.count({ where: { status: 'maintenance' } }),
            prisma.pC.count({ where: { status: 'offline' } }),
            prisma.pC.groupBy({
                by: ['os'],
                _count: {
                    os: true
                }
            }),
            prisma.pC.groupBy({
                by: ['location'],
                _count: {
                    location: true
                }
            }),
            prisma.componentChange.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    pc: {
                        select: { hostname: true, location: true }
                    }
                }
            })
        ])

        return NextResponse.json({
            success: true,
            data: {
                totalPCs,
                activePCs,
                maintenancePCs,
                offlinePCs,
                osBreakdown: osBreakdown.map(item => ({
                    name: item.os || 'Unknown',
                    count: item._count.os
                })),
                locationBreakdown: locationBreakdown.map(item => ({
                    name: item.location || 'Unassigned',
                    count: item._count.location
                })),
                recentChanges: recentChanges.map(change => ({
                    id: change.id,
                    severity: change.severity,
                    message: change.message,
                    subMessage: change.pc.hostname,
                    location: change.pc.location || 'Unassigned',
                    time: change.createdAt,
                    changeType: change.changeType
                }))
            }
        })
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
