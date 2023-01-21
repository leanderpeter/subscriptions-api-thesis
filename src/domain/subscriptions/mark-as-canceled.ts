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
  terminationReason: string;
  terminationDate: Date;
  metadata: {
    requestId: string;
    actor: string;
  };
}

export type MarkAsCanceled = (input: Input) => Promise<Subscription>;

export function markAsCanceled(deps: Dependencies): MarkAsCanceled {
  const l = createLogger("mark-as-canceled");
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

    if (sub.state !== SubscriptionState.CREATED) {
      const err = new ConflictError("mark as canceled");
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
        state: SubscriptionState.CANCELED,
        terminationReason: input.terminationReason,
        terminationDate: input.terminationDate,
      },
      event: {
        name: SubscriptionEventName.SUBSCRIPTION_CANCELED,
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
