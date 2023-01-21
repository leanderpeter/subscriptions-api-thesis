import createSubscriptionAction, {
  CreateSubscriptionActionInput,
} from "~/src/domain/subscriptions/create-subscription";
import {
  ConflictError,
  InvalidInputError,
  NotFoundError,
} from "~/src/domain/types/errors";
import { mockCustomer, mockSubscription } from "~/src/mocks/model";
import {
  mockSubRepository,
  mockCarRepository,
  mockCustomerRepository,
} from "~/src/mocks/repo";
import {
  SubscriptionEventName,
  SubscriptionTermType,
  SubscriptionType,
} from "~/src/domain/types/subscription";

function createContext() {
  const subscriptionRepo = mockSubRepository();
  const carRepo = mockCarRepository();
  const customerRepo = mockCustomerRepository();
  return {
    subscriptionRepo,
    carRepo,
    customerRepo,
    createSubscription: createSubscriptionAction({
      subscriptionRepo,
      carRepo,
      customerRepo,
    }),
  };
}

describe("create-subscription action", () => {
  const now = new Date();
  const sampleB2CSubscription = mockSubscription({
    type: SubscriptionType.B2C,
    termType: SubscriptionTermType.FIXED,
    createdAt: undefined,
    updatedAt: undefined,
    state: undefined,
    terminationDate: undefined,
    terminationReason: undefined,
  });
  const sampleB2BSubscription = mockSubscription({
    type: SubscriptionType.B2B,
    termType: SubscriptionTermType.FIXED,
    createdAt: undefined,
    updatedAt: undefined,
    state: undefined,
    terminationDate: undefined,
    terminationReason: undefined,
  });

  const sampleRetentionB2CSubscription = mockSubscription({
    type: SubscriptionType.B2C,
    termType: SubscriptionTermType.FIXED,
    createdAt: undefined,
    updatedAt: undefined,
    state: undefined,
    terminationDate: undefined,
    terminationReason: undefined,
  });

  const verifiedSampleCustomer = mockCustomer({
    internalVerificationDecisionDl: "approved",
    internalVerificationDecisionId: "approved",
  });
  const unVerifiedSampleCustomer = mockCustomer({
    internalVerificationDecisionDl: undefined,
    internalVerificationDecisionId: undefined,
  });
  const input: CreateSubscriptionActionInput = {
    subscription: {
      carReservationToken: "testToken",
      ...sampleB2CSubscription,
    },
    metadata: {
      requestId: "testRequestId",
      actor: "jest",
    },
  };
  const b2bInput: CreateSubscriptionActionInput = {
    subscription: {
      carReservationToken: "testToken",
      ...sampleB2BSubscription,
    },
    metadata: {
      requestId: "testRequestId",
      actor: "jest",
    },
  };

  const b2cRetentionInput: CreateSubscriptionActionInput = {
    subscription: {
      carReservationToken: "testToken",
      ...sampleRetentionB2CSubscription,
    },
    metadata: {
      requestId: "testRequestId",
      actor: "jest",
    },
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test("should create and return a B2C subscription", async () => {
    const ctx = createContext();
    ctx.carRepo.confirmReservation.mockResolvedValueOnce("validCarId");
    ctx.subscriptionRepo.create.mockResolvedValueOnce(sampleB2CSubscription);
    ctx.customerRepo.getById.mockResolvedValueOnce(verifiedSampleCustomer);
    const subscription = await ctx.createSubscription(input);
    expect(subscription).toStrictEqual(sampleB2CSubscription);
    expect(ctx.subscriptionRepo.create).toHaveBeenCalledWith({
      subscription: {
        amount: sampleB2CSubscription.amount,
        carId: "validCarId",
        contactId: sampleB2CSubscription.contactId,
        deposit: sampleB2CSubscription.deposit,
        handoverAddressExtra: sampleB2CSubscription.handoverAddressExtra,
        preferredHandoverDate: sampleB2CSubscription.preferredHandoverDate,
        handoverCity: sampleB2CSubscription.handoverCity,
        handoverFirstName: sampleB2CSubscription.handoverFirstName,
        handoverHouseNumber: sampleB2CSubscription.handoverHouseNumber,
        handoverLastName: sampleB2CSubscription.handoverLastName,
        handoverStreet: sampleB2CSubscription.handoverStreet,
        handoverZip: sampleB2CSubscription.handoverZip,
        id: sampleB2CSubscription.id,
        mileagePackage: sampleB2CSubscription.mileagePackage,
        mileagePackageFee: sampleB2CSubscription.mileagePackageFee,
        additionalMileageFee: sampleB2CSubscription.additionalMileageFee,
        signingDate: sampleB2CSubscription.signingDate,
        term: sampleB2CSubscription.term,
        termType: sampleB2CSubscription.termType,
        type: sampleB2CSubscription.type,
      },
      event: {
        name: SubscriptionEventName.SUBSCRIPTION_CREATED,
        actor: input.metadata.actor,
        time: now,
      },
    });
  });

  test("should create and return a B2C subscription", async () => {
    const ctx = createContext();
    ctx.carRepo.confirmReservation.mockResolvedValueOnce("validCarId");
    ctx.subscriptionRepo.create.mockResolvedValueOnce(
      sampleRetentionB2CSubscription
    );
    ctx.customerRepo.getById.mockResolvedValueOnce(verifiedSampleCustomer);
    const subscription = await ctx.createSubscription(b2cRetentionInput);
    expect(subscription).toStrictEqual(sampleRetentionB2CSubscription);
    expect(ctx.subscriptionRepo.create).toHaveBeenCalledWith({
      subscription: {
        amount: sampleRetentionB2CSubscription.amount,
        carId: "validCarId",
        contactId: sampleRetentionB2CSubscription.contactId,
        deposit: sampleRetentionB2CSubscription.deposit,
        handoverAddressExtra:
          sampleRetentionB2CSubscription.handoverAddressExtra,
        preferredHandoverDate:
          sampleRetentionB2CSubscription.preferredHandoverDate,
        handoverCity: sampleRetentionB2CSubscription.handoverCity,
        handoverFirstName: sampleRetentionB2CSubscription.handoverFirstName,
        handoverHouseNumber: sampleRetentionB2CSubscription.handoverHouseNumber,
        handoverLastName: sampleRetentionB2CSubscription.handoverLastName,
        handoverStreet: sampleRetentionB2CSubscription.handoverStreet,
        handoverZip: sampleRetentionB2CSubscription.handoverZip,
        id: sampleRetentionB2CSubscription.id,
        mileagePackage: sampleRetentionB2CSubscription.mileagePackage,
        mileagePackageFee: sampleRetentionB2CSubscription.mileagePackageFee,
        additionalMileageFee:
          sampleRetentionB2CSubscription.additionalMileageFee,
        signingDate: sampleRetentionB2CSubscription.signingDate,
        term: sampleRetentionB2CSubscription.term,
        termType: sampleRetentionB2CSubscription.termType,
        type: sampleRetentionB2CSubscription.type,
      },
      event: {
        name: SubscriptionEventName.SUBSCRIPTION_CREATED,
        actor: input.metadata.actor,
        time: now,
      },
    });
  });

  test("should throw an error if the car reservation token is invalid", async () => {
    const ctx = createContext();
    ctx.carRepo.confirmReservation.mockRejectedValueOnce(
      new NotFoundError("testToken")
    );
    ctx.subscriptionRepo.create.mockResolvedValueOnce(sampleB2CSubscription);
    ctx.customerRepo.getById.mockResolvedValueOnce(verifiedSampleCustomer);
    await expect(ctx.createSubscription(input)).rejects.toThrow(NotFoundError);
    expect(ctx.subscriptionRepo.create).not.toHaveBeenCalled();
  });

  test("should throw an error if the car reservation token is used", async () => {
    const ctx = createContext();
    ctx.carRepo.confirmReservation.mockRejectedValueOnce(
      new ConflictError("confirmReservation<testToken>")
    );
    ctx.subscriptionRepo.create.mockResolvedValueOnce(sampleB2CSubscription);
    ctx.customerRepo.getById.mockResolvedValueOnce(verifiedSampleCustomer);
    await expect(ctx.createSubscription(input)).rejects.toThrow(ConflictError);
    expect(ctx.subscriptionRepo.create).not.toHaveBeenCalled();
  });

  test("should throw an error if the input is invalid", async () => {
    const ctx = createContext();
    ctx.carRepo.confirmReservation.mockResolvedValueOnce("validCarId");
    ctx.subscriptionRepo.create.mockRejectedValueOnce(
      new Error("invalid input")
    );
    const invalidInput = {
      ...input,
      contactId: "1q34354654236457563747567857867876867978978978978978978987",
    };
    ctx.customerRepo.getById.mockResolvedValueOnce(verifiedSampleCustomer);
    await expect(ctx.createSubscription(invalidInput)).rejects.toThrow(
      "invalid input"
    );
  });

  test("should throw an error if the customer cannot be fetched for given inputs", async () => {
    const ctx = createContext();
    ctx.carRepo.confirmReservation.mockResolvedValueOnce("validCarId");
    ctx.subscriptionRepo.create.mockResolvedValueOnce(sampleB2CSubscription);
    ctx.customerRepo.getById.mockRejectedValueOnce(
      new InvalidInputError("contactId", "not found")
    );
    await expect(ctx.createSubscription(input)).rejects.toThrow(
      "contactId is invalid: not found"
    );
    expect(ctx.subscriptionRepo.create).not.toHaveBeenCalled();
  });

  test("should throw an error if the customer is not verified for a non B2B subscription", async () => {
    const ctx = createContext();
    ctx.carRepo.confirmReservation.mockResolvedValueOnce("validCarId");
    ctx.subscriptionRepo.create.mockResolvedValueOnce(sampleB2CSubscription);
    ctx.customerRepo.getById.mockResolvedValueOnce(unVerifiedSampleCustomer);
    await expect(ctx.createSubscription(input)).rejects.toThrow(
      "contactId is invalid: Internal verification decision: Customer is not verified"
    );
    expect(ctx.subscriptionRepo.create).not.toHaveBeenCalled();
  });

  test("should create and return a B2B subscription", async () => {
    const ctx = createContext();
    ctx.carRepo.confirmReservation.mockResolvedValueOnce("validCarId");
    ctx.subscriptionRepo.create.mockResolvedValueOnce(sampleB2BSubscription);
    ctx.customerRepo.getById.mockResolvedValueOnce(verifiedSampleCustomer);
    const subscription = await ctx.createSubscription(b2bInput);
    expect(ctx.customerRepo.getById).toHaveBeenCalledWith(
      b2bInput.subscription.contactId,
      { actor: b2bInput.metadata.actor, requestId: b2bInput.metadata.requestId }
    );
    expect(subscription).toStrictEqual(sampleB2BSubscription);
    expect(ctx.subscriptionRepo.create).toHaveBeenCalledWith({
      subscription: {
        amount: sampleB2BSubscription.amount,
        carId: "validCarId",
        contactId: sampleB2BSubscription.contactId,
        deposit: sampleB2BSubscription.deposit,
        handoverAddressExtra: sampleB2BSubscription.handoverAddressExtra,
        preferredHandoverDate: sampleB2BSubscription.preferredHandoverDate,
        handoverCity: sampleB2BSubscription.handoverCity,
        handoverFirstName: sampleB2BSubscription.handoverFirstName,
        handoverHouseNumber: sampleB2BSubscription.handoverHouseNumber,
        handoverLastName: sampleB2BSubscription.handoverLastName,
        handoverStreet: sampleB2BSubscription.handoverStreet,
        handoverZip: sampleB2BSubscription.handoverZip,
        id: sampleB2BSubscription.id,
        mileagePackage: sampleB2BSubscription.mileagePackage,
        mileagePackageFee: sampleB2BSubscription.mileagePackageFee,
        additionalMileageFee: sampleB2BSubscription.additionalMileageFee,
        signingDate: sampleB2BSubscription.signingDate,
        term: sampleB2BSubscription.term,
        termType: sampleB2BSubscription.termType,
        type: sampleB2BSubscription.type,
      },
      event: {
        name: SubscriptionEventName.SUBSCRIPTION_CREATED,
        actor: input.metadata.actor,
        time: now,
      },
    });
  });
});
