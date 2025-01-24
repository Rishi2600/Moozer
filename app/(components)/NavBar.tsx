"use client"

import {signIn} from "next-auth/react";

export default function NavBar() {
    return (
        <>
        <header className="bg-gray-600 text-gray-100">
            <nav className="flex justify-between items w-full px-10 py-4">
                <div>Moosi</div>
                <div>
                    <button onClick={()=> {signIn()}}>SignIn</button>
                </div>
            </nav>
        </header>
        </>
    )
}