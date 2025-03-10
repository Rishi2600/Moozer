import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export async function GET(
    req: NextApiRequest, 
    res: NextApiResponse
) {
  const data = await prisma.user.findMany({
    where: {
      email: "alice@prisma.io",
      name: "Alice",
    },
  });
  console.log(data);
  res.json({
    data: data,
    message: "fetched some data from the db for testing"
  });
}
