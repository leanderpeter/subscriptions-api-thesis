import "source-map-support/register";
import withLogger from "~/src/interfaces/lambda-http/with-logger";
import createHandler from "./handler";
import { markAsActive } from "~/src/domain/subscriptions/mark-as-active";
import { markAsCanceled } from "~/src/domain/subscriptions/mark-as-canceled";
import {
  getDBConnection,
  getSubscriptionRepository,
} from "~/src/interfaces/bootstrap";
import { markAsStopped } from "~/src/domain/subscriptions/mark-as-stopped";
import { markAsInactive } from "~/src/domain/subscriptions/mark-as-inactive";
import { markAsEnded } from "~/src/domain/subscriptions/mark-as-ended";

const dbConnection = getDBConnection();
const subRepo = getSubscriptionRepository(dbConnection);

export const handler = withLogger(
  createHandler({
    markAsActive: markAsActive({
      subRepo,
    }),
    markAsCanceled: markAsCanceled({ subRepo }),
    markAsStopped: markAsStopped({ subRepo }),
    markAsInactive: markAsInactive({ subRepo }),
    markAsEnded: markAsEnded({ subRepo }),
  })
);
