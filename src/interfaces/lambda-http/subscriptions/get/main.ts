import "source-map-support/register";
import withLogger from "~/src/interfaces/lambda-http/with-logger";
import createHandler from "./handler";
import { getById } from "~/src/domain/subscriptions/get-by-id";
import {
  getCustomerRepository,
  getDBConnection,
  getSubscriptionRepository,
} from "~/src/interfaces/bootstrap";

const dbConnection = getDBConnection();
const subRepo = getSubscriptionRepository(dbConnection);
const customerRepo = getCustomerRepository();

export const handler = withLogger(
  createHandler({
    getById: getById({
      subRepo,
      customerRepo,
    }),
  })
);
