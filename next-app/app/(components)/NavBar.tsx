'use client'

import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import {signIn, signOut, useSession} from "next-auth/react";

export default function NavBar() {

    const session = useSession()
    
    return (
        <>
        <header className="bg-gray-900 text-gray-100">
            <nav className="flex justify-between items w-full px-10 py-4">
                <div className="text-5xl text-gray-200 font-sans font-bold ">Moozer</div>
                <div className="font-sans font-semibold">
                    {session.status==="unauthenticated" && <Button variant="ghost" className="text-white hover:text-purple-400" 
                    onClick={()=> {signIn()}}>
                        Login
                    </Button>}
                    {session.status==="unauthenticated" && <Button className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-sm " 
                    onClick={()=> {signIn()}}>
                        SignUp
                    </Button>}
                    {session.status==="authenticated" && <Button className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-sm"
                    onClick={()=> {signOut()}}>
                        Signout
                    </Button>}
                </div>
            </nav>
        </header>
        </>
    )
}
//redirecting logic is not yet set,
//redirecting logic will be set when we use a callbackUrl under the Link tag