import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { signIn } from "next-auth/react";
import { prisma } from "./db";
import { PrismaAdapter } from "@auth/prisma-adapter"

if(!process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Credentials missing from the google OAuth")
}
if(!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    throw new Error("credentials missing from github OAuth")
}

export const authOptions = {
    adapter: PrismaAdapter(prisma),
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
                
                const user = { id: "1", name: "Admin", email: "Amdin@example.com" }
                if(user) {
                    return user;
                }else{
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async signIn(params: any) {
            console.log(params);
            if(!params.user.email) {
                return false;
            }

            try {
                await prisma.user.create({
                    data: {
                        email: params.user.email,
                        provider: "Google"
                    }
                })
            } catch (e){
                console.log(e);
            }
            return true;
        }
    }
}
/*If using prisma adapter, this callback logic is not needed at all until the user want role based auth*/