Democratic music listening Platform.
 Things to learn (Tech Stacks) - 

* Next.JS
* Next-Auth
* Tailwind & ShadCN
* Postgres + Prisma
* Schemas
* YouTube API / Spotify API
* Regex
* WebSockets: Not necessarily needed but can be added as a feature.

Steps & Architecture

1. Initialize a Next.JS Project
2. Add NextAuth for Authentication (Google, Credentials)
3. Create the Schema for User, Space, ActiveStream, StreamHistory
4. Create endpoints for lets
  1. a user create a space
  2. end users add stream
  3. end users upvote/cancel upvote on stream
  4. Lets everyone fetch the current stream (with their upvote)
5. Create a WebSocket server where
  1. Users can subscribe to streams (updates on a certain room)
  2. Users get back an update whenever upvotes change
6. Create the frontend
  1. Landing page
  2. Spaces page
  3. Individual space change

