import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const labId = searchParams.get('labId')

        let whereClause: any = {}
        let activityWhereClause: any = {}

        if (labId) {
            const lab = await prisma.lab.findUnique({
                where: { id: labId }
            })
            if (lab) {
                whereClause.location = lab.name
                activityWhereClause.pc = { location: lab.name }
                console.log('Stats API: Filtering by lab:', lab.name, 'with whereClause:', whereClause)
            } else {
                console.log('Stats API: Lab not found with id:', labId)
            }
        }

        // Get last 7 days for trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const [totalPCs, activePCs, maintenancePCs, offlinePCs, osBreakdown, locationBreakdown, recentChanges, dailyActivity] = await Promise.all([
            prisma.pC.count({ where: whereClause }),
            prisma.pC.count({ where: { status: 'active', ...whereClause } }),
            prisma.pC.count({ where: { status: 'maintenance', ...whereClause } }),
            prisma.pC.count({ where: { status: 'offline', ...whereClause } }),
            prisma.pC.groupBy({
                by: ['os'],
                where: whereClause,
                _count: {
                    os: true
                }
            }),
            prisma.pC.groupBy({
                by: ['location'],
                where: whereClause,
                _count: {
                    id: true
                }
            }),
            prisma.componentChange.findMany({
                where: activityWhereClause,
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    pc: {
                        select: { hostname: true, location: true }
                    }
                }
            }),
            // Get daily activity counts for last 7 days
            prisma.componentChange.groupBy({
                by: ['createdAt'],
                where: {
                    ...activityWhereClause,
                    createdAt: { gte: sevenDaysAgo }
                },
                _count: { id: true }
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
                })),
                // Process daily trend data
                dailyTrend: (() => {
                    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                    const result: { day: string; date: string; count: number }[] = [];

                    // Create last 7 days
                    for (let i = 6; i >= 0; i--) {
                        const date = new Date();
                        date.setDate(date.getDate() - i);
                        date.setHours(0, 0, 0, 0);

                        const dateStr = date.toISOString().split('T')[0];
                        const dayName = dayNames[date.getDay()];

                        // Count activities for this day
                        const count = dailyActivity.filter((a: any) => {
                            const actDate = new Date(a.createdAt);
                            return actDate.toISOString().split('T')[0] === dateStr;
                        }).reduce((sum: number, a: any) => sum + a._count.id, 0);

                        result.push({
                            day: dayName,
                            date: `${date.getDate()}/${date.getMonth() + 1}`,
                            count
                        });
                    }

                    return result;
                })()
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
