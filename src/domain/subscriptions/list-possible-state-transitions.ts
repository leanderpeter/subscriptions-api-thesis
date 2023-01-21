import createLogger from "~/src/utils/logger";
import { NotFoundError } from "~/src/domain/types/errors";
import {
  Subscription,
  SubscriptionState,
  SubscriptionRepository,
} from "~/src/domain/types/subscription";

export interface Dependencies {
  subRepo: SubscriptionRepository;
}

export interface Input {
  id: string;
  metadata: {
    requestId: string;
    actor: string;
  };
}

export type ListPossibleStateTransitions = (
  input: Input
) => Promise<SubscriptionState[]>;

const l = createLogger("list-possible-state-transitions");

export function listPossibleStateTransitions(
  deps: Dependencies
): ListPossibleStateTransitions {
  return async (input) => {
    let sub: Subscription;
    let states: SubscriptionState[];
    try {
      sub = await deps.subRepo.getById(input.id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        l.info("not found", {
          actor: input.metadata.actor,
          requestId: input.metadata.requestId,
          id: input.id,
        });
      } else {
        l.error("error getting subscription", {
          actor: input.metadata.actor,
          requestId: input.metadata.requestId,
          id: input.id,
          err: (err as Error).message,
        });
      }
      throw err;
    }

    switch (sub.state) {
      case SubscriptionState.CREATED:
        states = [SubscriptionState.CANCELED, SubscriptionState.ACTIVE];
        break;
      case SubscriptionState.ACTIVE:
        states = [SubscriptionState.STOPPED, SubscriptionState.INACTIVE];
        break;
      case SubscriptionState.INACTIVE:
        states = [SubscriptionState.ENDED];
        break;
      default:
        states = [];
    }
    l.info("success", {
      actor: input.metadata.actor,
      requestId: input.metadata.requestId,
      id: input.id,
    });
    return states;
  };
}
