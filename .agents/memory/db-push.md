---
name: db schema push required
description: Run `pnpm --filter @workspace/db run push` whenever a new table is added to the schema.
---
Adding a table to `lib/db/src/schema/` does NOT automatically create it in the database. Must run:

  cd /home/runner/workspace/lib/db && pnpm run push

**Why:** Drizzle uses push-based migration for this project (not generated migration files). New schema changes need to be explicitly pushed.
**How to apply:** Any time a backup/API route returns 500 and logs show DB errors, check if the table exists by running push.
