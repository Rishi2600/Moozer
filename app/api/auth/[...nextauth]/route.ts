import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

if(!process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Credentials missing from the google OAuth")
}
if(!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    throw new Error("credentials missing from github OAuth")
}

const handler = NextAuth({
    providers: [
        GoogleProvider({
            profile(profile){
                console.log(profile)

                const id = profile.sub
                return {
                    profile,
                    id
                }
            },
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }),
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: {label: "username", type: "text", placeholder: "Username"},
                password: {label: "password", type: "password", placeholder: "Password"}
            },
            async authorize(credentials) {
                console.log(credentials)
                //here the authentication with database logics will be written
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
