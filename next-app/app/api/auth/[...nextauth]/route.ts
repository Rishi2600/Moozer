import { authOptions } from "@/lib/next-auth";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);

export {handler as GET, handler as POST};

// export const GET = handler;
// export const POST = handler;

// export const {GET, POST} = handler;