# Database Migrations

Numbered SQL files. Apply them in order against `$DATABASE_URL`.

```bash
# Apply a specific migration:
psql "$DATABASE_URL" -f src/db/migrations/001_initial_schema.sql

# Apply all in order:
for f in src/db/migrations/*.sql; do
  echo "Applying $f"
  psql "$DATABASE_URL" -f "$f"
done
```

## Conventions

- File name: `NNN_short_description.sql` where NNN is zero-padded.
- Each statement should be idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, etc).
- Wrap multi-step changes in `BEGIN; ... COMMIT;`.
- Never edit a migration after it's been applied. Add a new one.

## State

`001_initial_schema.sql` documents the schema as of 2026-05-01. It's the
floor — everything else builds on top.
