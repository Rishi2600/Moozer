import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

if(!process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Credentials missing from the OAuth")
}

const handler = NextAuth({
    providers: [
        GoogleProvider({
            profile(profile){
                console.log(profile)
                return profile;
            },
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: {label: "username", type: "text", placeholder: "Username"},
                password: {label: "password", type: "password", placeholder: "Password"}
            },
            async authorize(credentials) {
                console.log(credentials)
                const user = { id: "1", name: "Admin", email: "Amdin@example.com" }
                if(user) {
                    return user;
                }else{
                    return null;
                }
            }
        })
    ]
});

// export {handler as GET, handler as POST};
export const GET = handler;
export const POST = handler;
