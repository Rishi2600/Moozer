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

        const extractedId = data.url.split("?v=")[1]
        await prismaClient.stream.create({
            data: {
                userId: data.creatorId,
                url: data.url,
                extractedId: extractedId,
                type: "Youtube"
            }
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

export async function GET (req: NextRequest) {

    //the way to pass some data via query params
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    
    const streams = await prismaClient.stream.findMany({
        where: {
            userId: creatorId ?? ""
        }
    })

    return NextResponse.json({
        streams: streams
    })
}