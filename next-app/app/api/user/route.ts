import { prisma } from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async function GET (req:NextApiRequest, res: NextApiResponse) {
    const data = prisma;
    console.log(data);
    res.json({
        message: `data is: ${data}`
    })

}