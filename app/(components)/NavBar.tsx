'use client'

import {signIn, signOut, useSession} from "next-auth/react";

export default function NavBar() {

    const session = useSession()
    
    return (
        <>
        <header className="bg-gray-600 text-gray-100">
            <nav className="flex justify-between items w-full px-10 py-4">
                <div>Moosi</div>
                <div>
                    {session.status==="unauthenticated" && <button onClick={()=> {signIn()}}>SignIn</button>}
                    {session.status==="authenticated" && <button onClick={()=> {signOut()}}>Signout</button>}
                </div>
            </nav>
        </header>
        </>
    )
}
//redirecting logic is not yet set,
//redirecting logic will be set when we use a callbackUrl under the Link tag