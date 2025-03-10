'use client'

import { SessionProvider } from "next-auth/react";

export function Providers({children}: {
    children: React.ReactNode
}) {
  return (
    <SessionProvider>
        {children}
    </SessionProvider>
  )
}

//providers needs to run on the client, thus we used client component here.
//we can use getServerSession if we want the component to be the server component.