import "source-map-support/register";
import withLogger from "~/src/interfaces/lambda-http/with-logger";
import createHandler from "./handler";
import createSubscriptionAction from "~/src/domain/subscriptions/create-subscription";
import {
  getCarRepository,
  getCustomerRepository,
  getSubscriptionRepository,
  getDBConnection,
} from "~/src/interfaces/bootstrap";

const dbConnection = getDBConnection();
const subscriptionRepo = getSubscriptionRepository(dbConnection);
const carRepo = getCarRepository();
const customerRepo = getCustomerRepository();

export const handler = withLogger(
  createHandler({
    createSubscription: createSubscriptionAction({
      subscriptionRepo,
      carRepo,
      customerRepo,
    }),
  })
);
