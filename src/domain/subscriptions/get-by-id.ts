import createLogger from "~/src/utils/logger";
import { NotFoundError } from "~/src/domain/types/errors";
import {
  Subscription,
  SubscriptionRepository,
} from "~/src/domain/types/subscription";
import { CustomerRepository } from "~/src/domain/types/customer";

export interface Dependencies {
  subRepo: SubscriptionRepository;
  customerRepo: CustomerRepository;
}

export interface Input {
  id: string;
  metadata: {
    requestId: string;
    actor: string;
  };
}

export type GetById = (input: Input) => Promise<Subscription>;

const l = createLogger("get-by-id");

export function getById(deps: Dependencies): GetById {
  return async (input) => {
    const { id, metadata } = input;
    let sub: Subscription;
    try {
      sub = await deps.subRepo.getById(input.id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        l.info("not found", {
          id,
          actor: metadata.actor,
          requestId: metadata.requestId,
        });
      } else {
        l.error("error getting subscription", {
          id,
          actor: metadata.actor,
          requestId: metadata.requestId,
          err: (err as Error).message,
        });
      }
      throw err;
    }

    l.info("subscription fetched successfully", {
      id,
      actor: metadata.actor,
      requestId: metadata.requestId,
    });

    return sub;
  };
}
