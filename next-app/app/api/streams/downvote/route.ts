import { prismaClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateDownvoteSchema = z.object({
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

    //here, this is the logic of the endpoint
    try{
        const data = CreateDownvoteSchema.parse(await req.json())
        await prismaClient.upvote.delete({
            where: {
                UserId_StreamId: {
                    UserId: user.id,
                    StreamId: data.streamId,   
                }
            }
        })
    } catch(e) {
        return NextResponse.json({
            message: "error, cannot downvote"
        }, {
            status: 403
        })
    }
}