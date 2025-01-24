import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

if(!process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Credentials miussing from the OAuth")
}

const handler = NextAuth({
    providers: [
        GoogleProvider({
            
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        })
    ]
});

// export {handler as GET, handler as POST};
export const GET = handler;
export const POST = handler;
