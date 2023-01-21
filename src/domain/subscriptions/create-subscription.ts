import createLogger from "~/src/utils/logger";
import {
  SubscriptionRepository,
  Subscription,
  SubscriptionEventName,
  SubscriptionType,
  CreateSubscriptionInputs,
} from "~/src/domain/types/subscription";
import { CarRepository } from "~/src/domain/types/cars";
import {
  Customer,
  CustomerRepository,
  CustomerVerificationStates,
} from "~/src/domain/types/customer";
import { InvalidInputError } from "~/src/domain/types/errors";

export interface Dependencies {
  subscriptionRepo: SubscriptionRepository;
  carRepo: CarRepository;
  customerRepo: CustomerRepository;
}

export type CreateSubscriptionActionInput = {
  subscription: Pick<
    Subscription,
    | "contactId"
    | "type"
    | "term"
    | "signingDate"
    | "termType"
    | "deposit"
    | "amount"
    | "mileagePackage"
    | "mileagePackageFee"
    | "additionalMileageFee"
    | "handoverFirstName"
    | "handoverLastName"
    | "handoverHouseNumber"
    | "handoverStreet"
    | "handoverCity"
    | "handoverZip"
    | "handoverAddressExtra"
    | "preferredHandoverDate"
  > & { carReservationToken: string; id?: string };
  metadata: {
    requestId: string;
    actor: string;
  };
};

export type CreateSubscription = (
  input: CreateSubscriptionActionInput
) => Promise<Subscription>;

export default function createSubscriptionAction(
  deps: Dependencies
): CreateSubscription {
  const logger = createLogger("create-subscription");
  return async (input: CreateSubscriptionActionInput) => {
    const { subscription: subscriptionInput, metadata } = input;
    const { carReservationToken, ...restSubscriptionInputs } =
      subscriptionInput;
    let carId: string;
    let customer: Customer;
    let subscription: Subscription;

    const isB2bSubscription =
      restSubscriptionInputs.type === SubscriptionType.B2B;

    try {
      customer = await deps.customerRepo.getById(subscriptionInput.contactId, {
        requestId: metadata.requestId,
        actor: metadata.actor,
      });
    } catch (custErr) {
      logger.error("failed to fetch customer", {
        actor: metadata.actor,
        err: (<Error>custErr).message,
        contactId: subscriptionInput.contactId,
        subscriptionId: subscriptionInput.id,
        carReservationToken,
      });
      throw new InvalidInputError("contactId", "not found");
    }

    if (!isB2bSubscription) {
      const isCustomerInternallyVerified =
        customer.internalVerificationDecisionDl ===
          CustomerVerificationStates.APPROVED &&
        customer.internalVerificationDecisionId ===
          CustomerVerificationStates.APPROVED;

      if (!isCustomerInternallyVerified) {
        const err = new InvalidInputError(
          "contactId",
          "Internal verification decision: Customer is not verified"
        );
        logger.error("Customer not verified", {
          actor: metadata.actor,
          requestId: metadata.requestId,
          id: subscriptionInput.id,
          err: (err as Error).message,
        });
        throw err;
      }
    }

    try {
      carId = await deps.carRepo.confirmReservation(
        carReservationToken,
        metadata
      );
    } catch (carErr) {
      logger.error("failed to reserve the car", {
        actor: metadata.actor,
        err: (<Error>carErr).message,
        carReservationToken,
      });
      throw carErr;
    }
    try {
      const createSubInputs: CreateSubscriptionInputs["subscription"] = {
        ...restSubscriptionInputs,
        carId,
      };
      subscription = await deps.subscriptionRepo.create({
        subscription: createSubInputs,
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CREATED,
          actor: metadata.actor,
          time: new Date(),
        },
      });
      logger.info("subscription created successfully", {
        actor: metadata.actor,
      });
    } catch (subErr) {
      logger.error("failed to create subscription", {
        actor: metadata.actor,
        err: (<Error>subErr).message,
        carId,
        input,
      });
      throw subErr;
    }
    return subscription;
  };
}
