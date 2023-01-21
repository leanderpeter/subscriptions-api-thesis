import "source-map-support/register";
import withLogger from "~/src/interfaces/lambda-http/with-logger";
import createHandler from "./handler";
import { listSubscriptions } from "~/src/domain/subscriptions/list";
import {
  getDBConnection,
  getSubscriptionRepository,
} from "~/src/interfaces/bootstrap";

const dbConnection = getDBConnection();
const subRepo = getSubscriptionRepository(dbConnection);

export const handler = withLogger(
  createHandler({
    listSubscriptions: listSubscriptions({
      subRepo,
    }),
  })
);
