import createLogger from "~/src/utils/logger";
import Migrator from "~/src/domain/types/migrator";

export interface Dependencies {
  pgMigrator: Migrator;
}

export default function createMigrator({
  pgMigrator,
}: Dependencies): () => Promise<string> {
  const logger = createLogger("run-migrations");
  const actor = "cd-pipeline";
  return async () => {
    try {
      await pgMigrator.applyMigrations();
    } catch (error) {
      const message = "error running migrations";
      logger.error(message, { actor, err: (error as Error).message });
      throw error;
    }

    logger.info("migration ran successfully", { actor });
    return "success";
  };
}
