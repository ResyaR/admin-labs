
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { credentialKey } = body;

        if (!credentialKey) {
            return NextResponse.json(
                { valid: false, message: "Credential key is required" },
                { status: 400, headers: corsHeaders }
            );
        }

        const cred = await prisma.appCredential.findUnique({
            where: { credentialKey },
        });

        if (!cred) {
            return NextResponse.json(
                { valid: false, message: "Invalid credential key" },
                { status: 401, headers: corsHeaders }
            );
        }

        if (!cred.isActive) {
            return NextResponse.json(
                { valid: false, message: "Credential has been deactivated" },
                { status: 403, headers: corsHeaders }
            );
        }

        return NextResponse.json({
            valid: true,
            name: cred.name,
            timestamp: new Date().toISOString()
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json(
            { valid: false, message: "Internal server error" },
            { status: 500, headers: corsHeaders }
        );
    }
}
