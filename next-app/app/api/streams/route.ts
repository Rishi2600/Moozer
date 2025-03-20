import { z } from "zod";
import { prismaClient } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
const YT_REGEX = new RegExp("https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+(&[\w=-]+)*")

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
        const isYt = YT_REGEX.test(data.url)
        if(!isYt) {
            NextResponse.json({
                message: "not a youtube link"
            }, {
                status: 411
            })
        }

        const extractedId = data.split        
        prismaClient.stream.create({
            //@ts-ignore
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
