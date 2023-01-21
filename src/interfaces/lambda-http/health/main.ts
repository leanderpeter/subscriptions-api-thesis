import "source-map-support/register";
import withLogger from "~/src/interfaces/lambda-http/with-logger";
import createHandler, {
  Dependencies,
} from "~/src/interfaces/lambda-http/health/handler";
import HttpHealthIndicator from "~/src/http/health-indicator";
import PostgresHealthIndicator from "~/src/postgres/health-indicator";
import { getDBConnection } from "~/src/interfaces/bootstrap";

const connection = getDBConnection();

const deps: Dependencies = {
  http: new HttpHealthIndicator(),
  db: new PostgresHealthIndicator(connection),
};

export const handler = withLogger(createHandler(deps));
