import createLogger from "~/src/utils/logger";
import {
  Subscription,
  SubscriptionRepository,
  ListSubscriptionFilters,
} from "~/src/domain/types/subscription";

export interface Dependencies {
  subRepo: SubscriptionRepository;
}

export type Input = {
  filters: ListSubscriptionFilters;
  count: number;
  offset: number;
  metadata: {
    requestId: string;
    actor: string;
  };
};

export type ListSubscriptions = (input: Input) => Promise<Subscription[]>;

const l = createLogger("list-subscriptions");

export function listSubscriptions(deps: Dependencies): ListSubscriptions {
  return async (input) => {
    let subs: Subscription[];
    try {
      subs = await deps.subRepo.list(input.filters, input.count, input.offset);
      l.info("subscriptions fetched successfully", {
        actor: input.metadata.actor,
        requestId: input.metadata.requestId,
      });
    } catch (err) {
      l.error("error getting subscriptions", {
        actor: input.metadata.actor,
        requestId: input.metadata.requestId,
        err: (err as Error).message,
        filters: input.filters,
      });
      throw err;
    }

    l.info("success", {
      actor: input.metadata.actor,
      requestId: input.metadata.requestId,
    });

    return subs;
  };
}
