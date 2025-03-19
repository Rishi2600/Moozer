import { NextRequest, NextResponse } from "next/server";
import {z} from "zod";

const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string()
})

export async function POST (req: NextRequest) {
    try {
        const data = CreateStreamSchema.parse(await req.json());
        console.log(data.creatorId)
    }catch(e) {
        console.log(e)
        return NextResponse.json({
            message: "Error while adding stream"
        }, {
            status: 411
        })
    }
}
