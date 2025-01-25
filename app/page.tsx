import NavBar from "./(components)/NavBar"
import { Providers } from "./provider"

export default function Home() {
  return(
    <>
      <div>
        <Providers>
        <NavBar />
        </Providers>
      </div>
    </>
  )
}
