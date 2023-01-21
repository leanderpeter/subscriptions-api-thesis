import "source-map-support/register";
import createHandler from "~/src/interfaces/lambda-postgres/apply-migrations/handler";
import PostgresMigrator from "~/src/postgres/migrator";
import { getDBConnection } from "~/src/interfaces/bootstrap";

const connection = getDBConnection();
const pgMigrator = new PostgresMigrator(connection);

export const handler = createHandler({ pgMigrator });
