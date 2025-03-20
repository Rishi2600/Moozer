import { z } from "zod";
import { prismaClient } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
const YT_REGEX = new RegExp(
    "/^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/"
)

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

        //this is done to find the extractedId & if the link belongs to a certain regex - yt.
        const isYt = data.url.match(YT_REGEX)
        if(!isYt) {
            NextResponse.json({
                message: "not a youtube link"
            }, {
                status: 411
            })
        }

        const extractedId = data.url.split("?v=")[1]

        const videoInfo = await youtubesearchapi.GetVideoDetails(extractedId);
        console.log(videoInfo.title);
        console.log(videoInfo.thumbnail.thumbnails);
        const thumbnails = await videoInfo.thumbnail.thumbnails;

        thumbnails.sort((a: {width: number}, b: {width: number}) => a.width < b.width ? -1 : 1)

        const stream = await prismaClient.stream.create({
            data: {
                userId: data.creatorId,
                url: data.url,
                extractedId: extractedId,
                type: "Youtube",
                title: videoInfo.title ?? "SUIII",
                bigImgUrl: thumbnails[thumbnails.length - 1].url ?? "",
                smallImgUrl: (thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url) ?? ""

            }
        })

        return NextResponse.json({
            message: "stream added",
            id: stream.id
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