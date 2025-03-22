'use client'

import {signIn, signOut, useSession} from "next-auth/react";

export default function NavBar() {

    const session = useSession()
    
    return (
        <>
        <header className="bg-gray-900 text-gray-100">
            <nav className="flex justify-between items w-full px-10 py-4">
                <div className="text-5xl text-gray-200 font-sans font-bold ">Moozer</div>
                <div className="font-sans font-semibold">
                    {session.status==="unauthenticated" && <button className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-sm " 
                    onClick={()=> {signIn()}}>
                        SignIn
                    </button>}
                    {session.status==="authenticated" && <button className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-sm"
                    onClick={()=> {signOut()}}>
                        Signout
                    </button>}
                </div>
            </nav>
        </header>
        </>
    )
}
//redirecting logic is not yet set,
//redirecting logic will be set when we use a callbackUrl under the Link tag