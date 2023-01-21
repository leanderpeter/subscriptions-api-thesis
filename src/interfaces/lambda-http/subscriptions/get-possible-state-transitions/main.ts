import withLogger from "~/src/interfaces/lambda-http/with-logger";
import createHandler from "./handler";
import { listPossibleStateTransitions } from "~/src/domain/subscriptions/list-possible-state-transitions";
import {
  getDBConnection,
  getSubscriptionRepository,
} from "~/src/interfaces/bootstrap";

const dbConnection = getDBConnection();
const subRepo = getSubscriptionRepository(dbConnection);

export const handler = withLogger(
  createHandler({
    listPossibleStateTransitions: listPossibleStateTransitions({ subRepo }),
  })
);
