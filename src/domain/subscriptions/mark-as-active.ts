import createLogger from "~/src/utils/logger";
import { ConflictError, NotFoundError } from "~/src/domain/types/errors";
import {
  Subscription,
  SubscriptionEventName,
  SubscriptionRepository,
  SubscriptionState,
  UpdateSubscriptionInputs,
} from "~/src/domain/types/subscription";

export interface Dependencies {
  subRepo: SubscriptionRepository;
}

export interface Input {
  id: string;
  note?: string;
  metadata: {
    requestId: string;
    actor: string;
  };
}

export type MarkAsActive = (input: Input) => Promise<Subscription>;

export function markAsActive(deps: Dependencies): MarkAsActive {
  const logger = createLogger("mark-as-active");
  return async (input: Input) => {
    const { id, note, metadata } = input;
    let sub: Subscription;
    try {
      sub = await deps.subRepo.getById(id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        logger.info("Subscription not found", {
          actor: metadata.actor,
          requestId: metadata.requestId,
          id: input.id,
        });
      } else {
        logger.error("error getting subscription", {
          actor: metadata.actor,
          requestId: metadata.requestId,
          id: input.id,
          err: (err as Error).message,
        });
      }
      throw err;
    }
    if (sub.state !== SubscriptionState.CREATED) {
      const err = new ConflictError("mark as active");
      logger.error("wrong state", {
        actor: metadata.actor,
        requestId: metadata.requestId,
        id: sub.id,
        err: (err as Error).message,
      });
      throw err;
    }

    const updateSubscriptionInputs: UpdateSubscriptionInputs = {
      id: sub.id,
      subscription: {
        state: SubscriptionState.ACTIVE,
      },
      event: {
        name: SubscriptionEventName.SUBSCRIPTION_ACTIVATED,
        actor: metadata.actor,
        notes: note,
        time: new Date(),
      },
    };

    try {
      sub = await deps.subRepo.update(updateSubscriptionInputs);
    } catch (err) {
      logger.error("error updating subscription", {
        actor: metadata.actor,
        requestId: metadata.requestId,
        id: sub.id,
        err: (err as Error).message,
      });
      throw err;
    }

    return sub;
  };
}
