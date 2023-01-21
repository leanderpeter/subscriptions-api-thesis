import createLogger from "~/src/utils/logger";
import {
  ListEventFilters,
  SortOrder,
  SubscriptionEvent,
  SubscriptionRepository,
} from "~/src/domain/types/subscription";

export interface Dependencies {
  subRepo: SubscriptionRepository;
}

export interface Input {
  filters: ListEventFilters;
  count: number;
  sortOrder: SortOrder;
  metadata: {
    requestId: string;
    actor: string;
  };
}

export type ListEventsByFilter = (input: Input) => Promise<SubscriptionEvent[]>;

const l = createLogger("list-events-by-filter");

export function listEventsByFilter(deps: Dependencies): ListEventsByFilter {
  return async (input) => {
    let events: SubscriptionEvent[];
    try {
      events = await deps.subRepo.listEvents(
        input.filters,
        input.count,
        input.sortOrder
      );
    } catch (err) {
      l.error("error getting subscription events", {
        actor: input.metadata.actor,
        requestId: input.metadata.requestId,
        input,
        err: (err as Error).message,
      });
      throw err;
    }

    l.info("success", {
      actor: input.metadata.actor,
      requestId: input.metadata.requestId,
      input,
    });

    return events;
  };
}
