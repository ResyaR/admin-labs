import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const labs = await prisma.lab.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // Count PCs for each lab
        const labsWithCount = await Promise.all(labs.map(async (lab: any) => {
            const pcCount = await prisma.pC.count({
                where: { location: lab.name }
            });
            return { ...lab, pcCount };
        }));

        return NextResponse.json({ success: true, data: labsWithCount });
    } catch (error) {
        console.error('Error fetching labs:', error);
        return NextResponse.json({ error: 'Failed to fetch labs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, capacity } = body;

        if (!name) {
            return NextResponse.json({ error: 'Lab name is required' }, { status: 400 });
        }

        const existingLab = await prisma.lab.findUnique({
            where: { name },
        });

        if (existingLab) {
            return NextResponse.json({ error: 'Lab with this name already exists' }, { status: 400 });
        }

        const lab = await prisma.lab.create({
            data: {
                name,
                description,
                capacity: capacity ? parseInt(capacity) : 0,
            },
        });

        return NextResponse.json({ success: true, data: lab });
    } catch (error: any) {
        console.error('Error creating lab:', error);
        return NextResponse.json({
            error: `Failed to create lab: ${error.message || String(error)}`
        }, { status: 500 });
    }
}
