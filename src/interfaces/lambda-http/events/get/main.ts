import "source-map-support/register";
import withLogger from "~/src/interfaces/lambda-http/with-logger";
import createHandler from "./handler";
import { listEventsByFilter } from "~/src/domain/subscriptions/list-events";
import {
  getDBConnection,
  getSubscriptionRepository,
} from "~/src/interfaces/bootstrap";

const dbConnection = getDBConnection();
const subRepo = getSubscriptionRepository(dbConnection);

export const handler = withLogger(
  createHandler({
    listEventsByFilter: listEventsByFilter({ subRepo }),
  })
);
