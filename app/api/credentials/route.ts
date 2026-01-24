
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Admin sees all credentials, Guru sees only their own
        const whereClause = user.role === 'admin' ? {} : { createdBy: user.username };

        const creds = await prisma.appCredential.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(creds);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const data: any = {
            name,
            createdBy: user.username || "admin",
        };

        if (body.credentialKey) {
            // Check if key already exists
            const existing = await prisma.appCredential.findUnique({
                where: { credentialKey: body.credentialKey },
            });
            if (existing) {
                return NextResponse.json({ error: "Credential Key must be unique" }, { status: 400 });
            }
            data.credentialKey = body.credentialKey;
        }

        const cred = await prisma.appCredential.create({
            data,
        });
        return NextResponse.json(cred);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create credential" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, credentialKey } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const data: any = {};
        if (name) data.name = name;
        if (credentialKey) {
            const existing = await prisma.appCredential.findFirst({
                where: {
                    credentialKey: credentialKey,
                    NOT: { id: id }
                },
            });
            if (existing) {
                return NextResponse.json({ error: "Credential Key must be unique" }, { status: 400 });
            }
            data.credentialKey = credentialKey;
        }

        const cred = await prisma.appCredential.update({
            where: { id },
            data,
        });

        return NextResponse.json(cred);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update credential" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.appCredential.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 });
    }
}
