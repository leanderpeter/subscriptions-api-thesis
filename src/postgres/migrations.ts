// This file is needed to ensure typescript includes the migration fiels in the traspiled bundle.
// You must add all migrations here, but if you forget migrations.test.ts will fail.

export * as migration_20220412101644_init from "~/src/postgres/migrations/20220412101644_init";
