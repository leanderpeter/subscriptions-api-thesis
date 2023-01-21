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

export type MarkAsInactive = (input: Input) => Promise<Subscription>;

export function markAsInactive(deps: Dependencies): MarkAsInactive {
  const l = createLogger("mark-as-inactive");
  return async (input: Input) => {
    const { id, metadata } = input;
    const ALLOWED_STATES = [
      SubscriptionState.ACTIVE,
      SubscriptionState.STOPPED,
    ];
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

    if (!ALLOWED_STATES.includes(sub.state)) {
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
        state: SubscriptionState.INACTIVE,
      },
      event: {
        name: SubscriptionEventName.SUBSCRIPTION_DEACTIVATED,
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
