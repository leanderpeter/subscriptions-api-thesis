import createLogger from "~/src/utils/logger";
import { NotFoundError, ConflictError } from "~/src/domain/types/errors";
import {
  Subscription,
  SubscriptionRepository,
  SubscriptionState,
  SubscriptionEventName,
  UpdateSubscriptionInputs,
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

export type MarkAsEnded = (input: Input) => Promise<Subscription>;

export function markAsEnded(deps: Dependencies): MarkAsEnded {
  const l = createLogger("mark-as-ended");
  return async (input: Input) => {
    const { id, metadata } = input;
    let sub: Subscription;
    try {
      sub = await deps.subRepo.getById(id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        l.info("not found", {
          actor: metadata.actor,
          requestId: metadata.requestId,
          id: input.id,
        });
      } else {
        l.error("error getting subscription", {
          actor: metadata.actor,
          requestId: metadata.requestId,
          id: input.id,
          err: (err as Error).message,
        });
      }
      throw err;
    }

    if (sub.state !== SubscriptionState.INACTIVE) {
      const err = new ConflictError("wrong state");
      l.error("wrong state", {
        actor: metadata.actor,
        requestId: metadata.requestId,
        id: input.id,
        err: (err as Error).message,
      });
      throw err;
    }

    const updateSubscriptionInputs: UpdateSubscriptionInputs = {
      id: sub.id,
      subscription: {
        state: SubscriptionState.ENDED,
      },
      event: {
        name: SubscriptionEventName.SUBSCRIPTION_ENDED,
        actor: metadata.actor,
        time: new Date(),
      },
    };

    try {
      sub = await deps.subRepo.update(updateSubscriptionInputs);
    } catch (err) {
      l.error("error updating subscription", {
        actor: metadata.actor,
        requestId: metadata.requestId,
        id: input.id,
        err: (err as Error).message,
      });
      throw err;
    }
    return sub;
  };
}
