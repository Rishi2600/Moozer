import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function adding(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@prisma.io",
    },
  });
  console.log(user);
  res.json({
    message: "added some data to the db for testing",
  });
}

export async function fetching(req: NextApiRequest, res: NextApiResponse) {
    const data = await prisma.user.findMany({
        where: {
            email: "alice@prisma.io",
            name: "Alice"
        }
    });
    console.log(data);
    res.json({
        data: data
    })
}
