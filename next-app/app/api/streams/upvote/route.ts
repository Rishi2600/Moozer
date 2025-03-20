import { prismaClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateUpvoteSchema = z.object({
    streamId: z.string()
})

export async function POST(req: NextRequest) {
    //here we are checking the authentication of the user
    const session = await getServerSession()
    
    const user = await prismaClient.user.findFirst({
        where: {
            email: session?.user?.email ?? ""
        }
    })

    if(!user) {
        return NextResponse.json({
            message: "user not authenticated"
        }, {
            status: 403
        })
    }

    try{
        const data = CreateUpvoteSchema.parse(await req.json())
        await prismaClient.upvote.create({
            data: {
                UserId: user.id,
                StreamId: data.streamId,
            }
        })
    } catch(e) {
        return NextResponse.json({
            message: "error, cannot upvote"
        }, {
            status: 403
        })
    }
}