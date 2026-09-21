# Migrations

One `.sql` file per applied migration, named after the migration as it appears in the project's own
migration history.

These four are the v2.1 authorization build. The seven migrations that precede them — Tool A's
schema and functions, and Tool B's v1.0 resolution columns, review functions, and `authenticated`
select policy — were applied to the project during those build sessions and live in the database's
migration history rather than as files here. `docs/supabase-setup.md` is the source of truth for
what the schema actually is; these files are the record of how this build changed it.

Never recreate, rename, retype, or drop anything Tool A owns. The protected objects are listed in
`CLAUDE.md` under Hard Rules.
