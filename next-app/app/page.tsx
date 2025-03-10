import NavBar from "./(components)/NavBar"

export default function Home() {
  return(
    <>
      <div>
        <NavBar />
      </div>
    </>
  )
}

//component rendering flow (keeping next-auth in mind) -> layout > providers > page > components