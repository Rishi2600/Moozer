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
  * a user create a space
  * end users add stream
  * end users upvote/cancel upvote on stream
  * Lets everyone fetch the current stream (with their upvote)
5. Create a WebSocket server where
  * Users can subscribe to streams (updates on a certain room)
  * Users get back an update whenever upvotes change
6. Create the frontend
  * Landing page
  * Spaces page
  * Individual space change

