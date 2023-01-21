import { PGSubscriptionRepository } from "~/src/postgres/subscriptions";
import createTestDB, { TestDBContext } from "~/src/postgres/test-utils";
import { ConflictError, NotFoundError } from "~/src/domain/types/errors";
import {
  AddEventInputs,
  CreateSubscriptionInputs,
  Subscription,
  SubscriptionEventName,
  SubscriptionState,
  SubscriptionType,
  UpdateSubscriptionInputs,
} from "~/src/domain/types/subscription";
import { mockSubscription } from "~/src/mocks/model";

describe("PGSubscriptionRepository", () => {
  describe("createSubscription", () => {
    let dBCtx: TestDBContext;
    let repo: PGSubscriptionRepository;
    beforeAll(async () => {
      dBCtx = await createTestDB();
      repo = new PGSubscriptionRepository(dBCtx.knex);
    });
    afterAll(async () => {
      await dBCtx?.destroy();
    });
    test("should create and return a Subscription without optional fields", async () => {
      const now = new Date();
      const input: CreateSubscriptionInputs = {
        subscription: mockSubscription({
          id: undefined,
          handoverAddressExtra: undefined,
        }),
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CREATED,
          actor: "jest",
          time: now,
          notes: "testing",
        },
      };
      const subscription = await repo.create(input);
      // matching created record with given inputs
      expect(subscription.amount).toBe(input.subscription.amount);
      expect(subscription.carId).toBe(input.subscription.carId);
      expect(subscription.contactId).toBe(input.subscription.contactId);
      expect(subscription.deposit).toBe(input.subscription.deposit);
      expect(subscription.preferredHandoverDate.toISOString()).toBe(
        input.subscription.preferredHandoverDate.toISOString()
      );
      expect(subscription.handoverCity).toBe(input.subscription.handoverCity);
      expect(subscription.handoverFirstName).toBe(
        input.subscription.handoverFirstName
      );
      expect(subscription.handoverHouseNumber).toBe(
        input.subscription.handoverHouseNumber
      );
      expect(subscription.handoverLastName).toBe(
        input.subscription.handoverLastName
      );
      expect(subscription.handoverStreet).toBe(
        input.subscription.handoverStreet
      );
      expect(subscription.handoverZip).toBe(input.subscription.handoverZip);
      expect(subscription.mileagePackage).toBe(
        input.subscription.mileagePackage
      );
      expect(subscription.mileagePackageFee).toBe(
        input.subscription.mileagePackageFee
      );
      expect(subscription.additionalMileageFee).toBe(
        input.subscription.additionalMileageFee
      );
      expect(subscription.signingDate.toISOString()).toBe(
        input.subscription.signingDate.toISOString()
      );
      expect(subscription.state).toBe(SubscriptionState.CREATED);
      expect(subscription.term).toBe(input.subscription.term);
      expect(subscription.termType).toBe(input.subscription.termType);
      expect(subscription.type).toBe(input.subscription.type);
      expect(subscription.handoverAddressExtra).toBeUndefined();
      // matching returned record with the actual data in DB
      const recordInDB = await repo.getById(subscription.id);
      expect(subscription).toStrictEqual(recordInDB);
      // checking if event was created
      const events = await repo.listEvents(
        { subscriptionId: [subscription.id] },
        10
      );
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.any(String),
        actor: "jest",
        name: SubscriptionEventName.SUBSCRIPTION_CREATED,
        time: now,
        notes: "testing",
        snapshot: subscription,
        subscriptionId: subscription.id,
      });
    });

    test("should create a Subscription with the given ID and return it", async () => {
      const now = new Date();
      const input: CreateSubscriptionInputs = {
        subscription: mockSubscription({ id: "test0001" }),
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CREATED,
          actor: "jest",
          time: now,
          notes: "testing",
        },
      };
      const subscription = await repo.create(input);
      const actual = await repo.getById("test0001");
      expect(subscription).toStrictEqual(actual);
      const events = await repo.listEvents(
        { subscriptionId: [subscription.id] },
        10
      );
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.any(String),
        actor: "jest",
        name: SubscriptionEventName.SUBSCRIPTION_CREATED,
        time: now,
        notes: "testing",
        snapshot: subscription,
        subscriptionId: subscription.id,
      });
    });

    test("should create and return a Subscription with optional fields", async () => {
      const now = new Date();
      const input: CreateSubscriptionInputs = {
        subscription: mockSubscription({
          id: "test0002",
        }),
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CREATED,
          actor: "jest",
          time: now,
          notes: "testing",
        },
      };
      const subscription = await repo.create(input);
      // matching created record with given optional inputs
      expect(subscription.id).toBe(input.subscription.id);
      // matching returned record with the actual data in DB
      const recordInDB = await repo.getById(subscription.id);
      expect(subscription).toStrictEqual(recordInDB);
      // checking if event was created
      const events = await repo.listEvents(
        { subscriptionId: [subscription.id] },
        10
      );
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.any(String),
        actor: "jest",
        name: SubscriptionEventName.SUBSCRIPTION_CREATED,
        time: now,
        notes: "testing",
        snapshot: subscription,
        subscriptionId: subscription.id,
      });
    });

    test("should fail on invalid data", async () => {
      const input: CreateSubscriptionInputs = {
        subscription: mockSubscription({
          contactId:
            "testCustomer0000000000000000000000987654345678909876543234567890876543212356456566543445567553453",
        }),
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CREATED,
          actor: "jest",
          time: new Date(),
        },
      };
      const outputPromise = repo.create(input);
      await expect(outputPromise).rejects.toThrow(Error);
    });

    test("should not allow duplicate IDs", async () => {
      const event = {
        name: SubscriptionEventName.SUBSCRIPTION_CREATED,
        actor: "jest",
        time: new Date(),
      };
      const input: CreateSubscriptionInputs = {
        subscription: mockSubscription({ id: "testForDuplicateID" }),
        event,
      };
      await repo.create(input);

      const input2: CreateSubscriptionInputs = {
        subscription: mockSubscription({ id: "testForDuplicateID" }),
        event,
      };
      const outputPromise = repo.create(input2);
      await expect(outputPromise).rejects.toThrow(ConflictError);
    });
  });

  describe("getById", () => {
    let dBCtx: TestDBContext;
    let repo: PGSubscriptionRepository;
    beforeAll(async () => {
      dBCtx = await createTestDB();
      repo = new PGSubscriptionRepository(dBCtx.knex);
    });
    afterAll(async () => {
      await dBCtx?.destroy();
    });
    test("should throw an Error on non-existent Subscription", async () => {
      const promise = repo.getById("unknown");
      await expect(promise).rejects.toThrow(NotFoundError);
    });
  });

  describe("list events", () => {
    let dBCtx: TestDBContext;
    let repo: PGSubscriptionRepository;
    beforeAll(async () => {
      dBCtx = await createTestDB();
      repo = new PGSubscriptionRepository(dBCtx.knex);
    });
    afterAll(async () => {
      await dBCtx?.destroy();
    });

    test("should fetch events based on from time filter", async () => {
      const now = new Date();

      const createInput: CreateSubscriptionInputs = {
        subscription: mockSubscription(),
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CREATED,
          actor: "jest",
          time: now,
          notes: "created",
        },
      };
      const createdSub = await repo.create(createInput);
      const events = await repo.listEvents(
        { from: now, subscriptionId: [createdSub.id] },
        50
      );
      expect(events.length).toBe(1);
    });

    test("should fetch events based on to time filter", async () => {
      const now = new Date();

      const createInput: CreateSubscriptionInputs = {
        subscription: mockSubscription(),
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CREATED,
          actor: "jest",
          time: now,
          notes: "created",
        },
      };
      const createdSub = await repo.create(createInput);
      const events = await repo.listEvents(
        { to: now, subscriptionId: [createdSub.id] },
        50
      );
      expect(events.length).toBe(1);
    });
  });

  describe("addEvent", () => {
    let dBCtx: TestDBContext;
    let repo: PGSubscriptionRepository;
    beforeAll(async () => {
      dBCtx = await createTestDB();
      repo = new PGSubscriptionRepository(dBCtx.knex);
    });
    afterAll(async () => {
      await dBCtx?.destroy();
    });
    test("should allow you to add an event to an existing subscription", async () => {
      const createInput: CreateSubscriptionInputs = {
        subscription: mockSubscription(),
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CREATED,
          actor: "jest",
          time: new Date(),
          notes: "created",
        },
      };
      const createdSub = await repo.create(createInput);
      const input: AddEventInputs = {
        id: createdSub.id,
        event: {
          name: SubscriptionEventName.HOLDER_AGREEMENT_GENERATED,
          actor: "jest",
          time: new Date(),
        },
      };
      const addedEvent = await repo.addEvent(input);
      const foundEvents = await repo.listEvents(
        {
          name: [SubscriptionEventName.HOLDER_AGREEMENT_GENERATED],
          subscriptionId: [createdSub.id],
        },
        1
      );
      expect(foundEvents.length).toBe(1);
      expect(JSON.stringify(foundEvents[0])).toBe(JSON.stringify(addedEvent));
    });

    test("should not allow you to add event to a non-existent subscription", async () => {
      const input: AddEventInputs = {
        id: "non-existent-id",
        event: {
          name: SubscriptionEventName.HOLDER_AGREEMENT_GENERATED,
          actor: "jest",
          time: new Date(),
        },
      };
      await expect(repo.addEvent(input)).rejects.toThrow(NotFoundError);
    });
  });

  describe("update subscription", () => {
    let dBCtx: TestDBContext;
    let repo: PGSubscriptionRepository;
    beforeAll(async () => {
      dBCtx = await createTestDB();
      repo = new PGSubscriptionRepository(dBCtx.knex);
    });
    afterAll(async () => {
      await dBCtx?.destroy();
    });

    test("should create, update and return a Subscription", async () => {
      const now = new Date();

      const createInput: CreateSubscriptionInputs = {
        subscription: mockSubscription({ state: SubscriptionState.ACTIVE }),
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CREATED,
          actor: "jest",
          time: now,
          notes: "created",
        },
      };
      const createdSubscription = await repo.create(createInput);

      const updateInput: UpdateSubscriptionInputs = {
        id: createdSubscription.id,
        subscription: {
          state: SubscriptionState.CANCELED,
          terminationReason: "Customer does not pass credit score",
          terminationDate: new Date(),
        },
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CANCELED,
          actor: "jest",
          time: now,
          notes: "updated",
        },
      };
      const updatedSubscription = await repo.update(updateInput);
      const actual = await repo.getById(updatedSubscription.id);
      expect(updatedSubscription.state).toStrictEqual(actual.state);
      expect(updatedSubscription.terminationReason).toStrictEqual(
        actual.terminationReason
      );
      expect(updatedSubscription.terminationDate).toStrictEqual(
        actual.terminationDate
      );
      const events = await repo.listEvents(
        {
          subscriptionId: [updatedSubscription.id],
          name: [SubscriptionEventName.SUBSCRIPTION_CANCELED],
        },
        10
      );
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.any(String),
        actor: "jest",
        name: SubscriptionEventName.SUBSCRIPTION_CANCELED,
        time: now,
        notes: "updated",
        snapshot: updatedSubscription,
        subscriptionId: updatedSubscription.id,
      });
    });

    test("passing optional fields as undefined should not overwrite the current values", async () => {
      const now = new Date();

      const createInput: CreateSubscriptionInputs = {
        subscription: mockSubscription(),
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CREATED,
          actor: "jest",
          time: now,
          notes: "created",
        },
      };
      const createdSubscription = await repo.create(createInput);

      const updateInput: UpdateSubscriptionInputs = {
        id: createdSubscription.id,
        subscription: {
          state: SubscriptionState.ENDED,
          terminationReason: undefined,
          terminationDate: undefined,
        },
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_ENDED,
          actor: "jest",
          time: now,
          notes: "updated",
        },
      };
      const updatedSubscription = await repo.update(updateInput);
      const actual = await repo.getById(updatedSubscription.id);
      expect(updatedSubscription.terminationReason).toBe(undefined);
      expect(updatedSubscription.terminationDate).toBe(undefined);
      expect(updatedSubscription.state).toBe(SubscriptionState.ENDED);
      expect(updatedSubscription).toStrictEqual(actual);
    });

    test("should fail to update non existent subscription", async () => {
      const now = new Date();
      const updateInput: UpdateSubscriptionInputs = {
        id: "42069",
        subscription: {
          state: SubscriptionState.CANCELED,
          terminationReason: "Credit score not passed",
        },
        event: {
          name: SubscriptionEventName.SUBSCRIPTION_CANCELED,
          actor: "jest",
          time: now,
          notes: "updated",
        },
      };
      const updatedSubscription = repo.update(updateInput);
      await expect(updatedSubscription).rejects.toThrow(Error);
    });
  });

  describe("list", () => {
    let dBCtx: TestDBContext;
    let repo: PGSubscriptionRepository;
    let sub1: Subscription;
    let sub2: Subscription;
    let sub3: Subscription;

    beforeAll(async () => {
      dBCtx = await createTestDB();
      repo = new PGSubscriptionRepository(dBCtx.knex);
      const ev = {
        name: SubscriptionEventName.SUBSCRIPTION_CREATED,
        actor: "jest",
        time: new Date(),
      };
      sub1 = mockSubscription({
        state: SubscriptionState.CREATED,
        contactId: "testCustomer1",
        type: SubscriptionType.MINIB2B,
      });
      await repo.create({ subscription: sub1, event: ev });
      sub2 = mockSubscription({
        state: SubscriptionState.CREATED,
        contactId: "testCustomer2",
        type: SubscriptionType.B2C,
      });
      await repo.create({ subscription: sub2, event: ev });
      sub3 = mockSubscription({
        id: "sub00000003",
        state: SubscriptionState.CREATED,
        contactId: "testCustomer1",
        type: SubscriptionType.B2B,
      });
      await repo.create({ subscription: sub3, event: ev });
    });

    afterAll(async () => {
      await dBCtx?.destroy();
    });

    test("should list multiple subscriptions", async () => {
      const subs = await repo.list();
      expect(subs.length).toBe(3);
    });

    test("should list subscriptions with a given car id", async () => {
      const subs = await repo.list({ carId: [sub1.carId] });
      expect(subs.length).toBe(1);
      expect(subs[0].carId).toEqual(sub1.carId);
    });

    test("should list subscriptions with multiple car ids", async () => {
      const subs = await repo.list({ carId: [sub1.carId, sub2.carId] });
      expect(subs.length).toBe(2);
      expect(subs[0].carId).toEqual(sub1.carId);
      expect(subs[1].carId).toEqual(sub2.carId);
    });

    test("should list subscriptions with a given status", async () => {
      const subs = await repo.list({ state: [SubscriptionState.CREATED] });
      expect(subs.length).toBe(3);
    });

    test("should list subscriptions with a given customer id", async () => {
      const subs = await repo.list({ contactId: [sub1.contactId] });
      expect(subs.length).toBe(2);
      expect(subs[0].contactId).toEqual(sub1.contactId);
      expect(subs[1].contactId).toEqual(sub3.contactId);
    });

    test("should list subscriptions with a given car id and status", async () => {
      const subs = await repo.list({
        carId: [sub1.carId],
        state: [sub1.state],
      });
      expect(subs.length).toBe(1);
      expect(subs[0].carId).toEqual(sub1.carId);
      expect(subs[0].state).toEqual(sub1.state);
    });

    test("should list subscriptions with a given customer id, car id and status", async () => {
      const subs = await repo.list({
        carId: [sub1.carId],
        state: [sub1.state],
        contactId: [sub1.contactId],
      });
      expect(subs.length).toBe(1);
      expect(subs[0].carId).toEqual(sub1.carId);
      expect(subs[0].state).toEqual(sub1.state);
      expect(subs[0].contactId).toEqual(sub1.contactId);
    });

    test("should return empty array if conditions do not match", async () => {
      const subs = await repo.list({
        carId: [sub1.carId],
        state: [SubscriptionState.ACTIVE],
      });
      expect(subs.length).toBe(0);
    });

    test("should list subscriptions with a given subscription_id", async () => {
      const subs = await repo.list({
        subscriptionId: [sub1.id, sub2.id],
      });
      expect(subs.length).toBe(2);
      expect(subs[0].id).toEqual(sub1.id);
      expect(subs[1].id).toEqual(sub2.id);
    });

    test("should list subscriptions of type B2C", async () => {
      const subs = await repo.list({
        type: [SubscriptionType.B2C],
      });
      expect(subs.length).toBe(1);
      expect(subs[0].id).toEqual(sub2.id);
    });

    test("should list subscriptions of type B2B", async () => {
      const subs = await repo.list({
        type: [SubscriptionType.B2B],
      });
      expect(subs.length).toBe(1);
      expect(subs[0].id).toEqual(sub3.id);
    });

    test("should list subscriptions of type MINIB2B", async () => {
      const subs = await repo.list({
        type: [SubscriptionType.MINIB2B],
      });
      expect(subs.length).toBe(1);
      expect(subs[0].id).toEqual(sub1.id);
    });
  });
});
