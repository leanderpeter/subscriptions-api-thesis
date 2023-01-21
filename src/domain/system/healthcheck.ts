import HealthIndicator from "~/src/domain/types/health-indicator";
import VERSION from "~/src/version";
import createLogger from "~/src/utils/logger";

export interface Dependencies {
  http: HealthIndicator;
  db: HealthIndicator;
}

export default function createHealthcheck(
  deps: Dependencies
): () => Promise<Record<string, string | number>> {
  const logger = createLogger("healthcheck");
  const actor = "http";
  return async () => {
    let db: number | "fail";
    let ip: string;
    try {
      db = (await deps.db.health()) as number;
    } catch (dbErr) {
      logger.error("failed to connect to the database", {
        actor,
        err: (<Error>dbErr).message,
      });
      db = "fail";
    }
    try {
      ip = (await deps.http.health()) as string;
    } catch (httpError) {
      logger.error("failed to connect to the internet", {
        actor,
        err: (<Error>httpError).message,
      });
      ip = "fail";
    }
    return { db, ip, version: VERSION };
  };
}
