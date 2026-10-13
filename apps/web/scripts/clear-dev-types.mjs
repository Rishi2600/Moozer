// `next dev` writes route types to .next/dev/types and tsconfig includes them.
// They go stale when a route is deleted, and `next typegen` only refreshes
// .next/types, so clear the dev copy before typechecking. A running dev
// server regenerates it on its next compile.
import { rmSync } from "node:fs";

rmSync(new URL("../.next/dev/types", import.meta.url), { recursive: true, force: true });
