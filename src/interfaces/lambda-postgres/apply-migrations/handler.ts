import createMigrator, {
  Dependencies,
} from "~/src/domain/system/apply-migrations";
// We need to import this otherwise typescript won't include the migrations in the bundle.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as migrations from "~/src/postgres/migrations";

export default function createHandler(
  deps: Dependencies
): () => Promise<string> {
  return async () => {
    const applyMigrations = createMigrator(deps);
    return await applyMigrations();
  };
}
