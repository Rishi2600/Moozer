import { z } from "zod";
import { prismaClient } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z
    .string()
    .startsWith("https://")
    .includes("youtube", {
        message: "the url must be from the youtube or spotify domain"
    })
});

export async function POST (req: NextRequest) {
    try {
        const data = CreateStreamSchema.parse(await req.json());
        console.log(data.creatorId)
        
        prismaClient.stream.create({
            userId: data.creatorId,
            url: data.url,
            
        })

    }catch(e) {
        console.log(e)
        return NextResponse.json({
            message: "Error while adding stream"
        }, {
            status: 411
        })
    }
}
