import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
        return NextResponse.json({ 
            message: "Email required" 
        }, 
        { 
            status: 400 
        });
    }

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return NextResponse.json({ 
            message: "User not found" 
        }, 
        { 
            status: 404 
        });
    }

    return NextResponse.json({ creatorId: user.id });
}
//this is done to extract the creatorId -- uuid at the first place.