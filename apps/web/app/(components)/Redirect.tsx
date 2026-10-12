"use client"

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Redirect() {

    const session = useSession()
    const router = useRouter()

    useEffect(() => {
        if(session.status==="authenticated") {
            router.push("/dashboard")
        }
    }, [session])

  return null;
}