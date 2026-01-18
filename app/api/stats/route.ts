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
                    id: true
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
                osBreakdown: (() => {
                    const groups: Record<string, number> = {};
                    osBreakdown.forEach((item: any) => {
                        let name = item.os || 'Unknown';
                        // Clean "Microsoft " prefix
                        name = name.replace(/^Microsoft\s+/, '');

                        // Grouping logic
                        if (name.includes('Windows 10')) name = 'Windows 10';
                        else if (name.includes('Windows 11')) name = 'Windows 11';
                        else if (name.includes('Windows 7')) name = 'Windows 7';
                        else if (name.includes('Windows 8')) name = 'Windows 8';
                        else if (name.includes('Ubuntu')) name = 'Ubuntu';

                        groups[name] = (groups[name] || 0) + item._count.os;
                    });

                    return Object.entries(groups)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count);
                })(),
                locationBreakdown: (() => {
                    const groups: Record<string, number> = {};
                    locationBreakdown.forEach((item: any) => {
                        const name = item.location || 'Unassigned';
                        groups[name] = (groups[name] || 0) + item._count.id;
                    });

                    // Check for actual nulls in DB that groupBy might have missed or handled differently
                    // (Ensure "Unassigned" correctly reflects the state of the fleet)
                    return Object.entries(groups)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count);
                })(),
                recentChanges: recentChanges.map((change: any) => ({
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
