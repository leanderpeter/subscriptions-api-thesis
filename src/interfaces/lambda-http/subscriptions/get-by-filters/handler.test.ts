import {
  SubscriptionState,
  SubscriptionType,
} from "~/src/domain/types/subscription";
import { mockIdArray, mockSubscription } from "~/src/mocks/model";
import { invoke } from "~/src/utils/test-utils";
import { mapSubscription } from "~/src/interfaces/lambda-http/subscriptions/get/handler";
import createHandler, {
  getReadCount,
} from "~/src/interfaces/lambda-http/subscriptions/get-by-filters/handler";

function createContext() {
  const listSubscriptions = jest.fn();
  const headers = {
    "x-actor": "me",
    "x--request-id": "test-request-id",
  };
  return {
    listSubscriptions,
    headers,
    handler: createHandler({ listSubscriptions }),
  };
}

describe("getReadCount", () => {
  test("should return the default value 50 when no count or filter params are passed", () => {
    const count = getReadCount({});
    expect(count).toBe(50);
  });

  test("should return the value of count when count is passed by the user", () => {
    const count = getReadCount({ count: 51 });
    expect(count).toBe(51);
  });

  test("should return the value of count when count is passed by the user, even when it lower than the default", () => {
    const count = getReadCount({ count: 1 });
    expect(count).toBe(1);
  });

  test("should return the value of count when count is passed by the user, even when other filters are present", () => {
    const count = getReadCount({ count: 1, carId: ["1", "2", "3"] });
    expect(count).toBe(1);
  });

  test("should return the the length of car ID filter if it is greater than the default", () => {
    const count = getReadCount({ carId: mockIdArray(100) });
    expect(count).toBe(100);
  });

  test("should return the the length of car ID filter if it is greater than the default and other filters", () => {
    const count = getReadCount({
      carId: mockIdArray(100),
      contactId: mockIdArray(60),
      subscriptionId: mockIdArray(99),
    });
    expect(count).toBe(100);
  });
});

describe("GET /subscriptions", () => {
  test("missing actor", async () => {
    const ctx = createContext();
    const res = await invoke(ctx.handler, {
      headers: {},
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "header x-actor is required",
      })
    );
  });

  describe("invalid query parameters", () => {
    test("count should be a number", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        queryStringParameters: {
          count: "hahaha",
        },
        headers: ctx.headers,
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toContain('"instancePath":"/count"');
      expect(res.body).toContain("must be number");
    });

    test("count should be a positive number >= 1", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        queryStringParameters: {
          count: "-100",
        },
        headers: ctx.headers,
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toContain('"instancePath":"/count"');
      expect(res.body).toContain("must be >= 1");
    });

    test("offset should be a number", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        queryStringParameters: {
          offset: "hahaha",
        },
        headers: ctx.headers,
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toContain('"instancePath":"/offset"');
      expect(res.body).toContain("must be number");
    });

    test("offset should be a positive number", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        queryStringParameters: {
          offset: "-100",
        },
        headers: ctx.headers,
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toContain('"instancePath":"/offset"');
      expect(res.body).toContain("must be >= 0");
    });

    test("should return error if state contains illegal values", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        queryStringParameters: {
          state: "-100,unknown,NEW_STATE",
        },
        headers: ctx.headers,
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toContain('"instancePath":"/state');
      expect(res.body).toContain("must be equal to one of the allowed values");
      expect(res.body).toContain(
        '"allowedValues":["CREATED","ACTIVE","CANCELED","STOPPED","INACTIVE","ENDED"]'
      );
    });

    test("should return error if type contains illegal values", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        queryStringParameters: {
          type: "typeA,unknown,NEW_TYPE",
        },
        headers: ctx.headers,
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toContain('"instancePath":"/type');
      expect(res.body).toContain("must be equal to one of the allowed values");
      expect(res.body).toContain('"allowedValues":["B2B","B2C","MINIB2B"]');
    });
  });

  test("generic error", async () => {
    const ctx = createContext();
    ctx.listSubscriptions.mockRejectedValueOnce(new Error("death"));
    const res = await invoke(ctx.handler, {
      headers: ctx.headers,
    });
    expect(ctx.listSubscriptions).toHaveBeenCalledWith({
      filters: {},
      count: 50,
      offset: 0,
      metadata: { requestId: "test-request-id", actor: "me" },
    });

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "something went wrong",
      })
    );
  });

  test("should return subscriptions for empty request query parameters", async () => {
    const ctx = createContext();
    const sub = mockSubscription();
    ctx.listSubscriptions.mockResolvedValueOnce([sub]);
    const res = await invoke(ctx.handler, {
      headers: ctx.headers,
    });
    expect(ctx.listSubscriptions).toHaveBeenCalledWith({
      filters: {},
      count: 50,
      offset: 0,
      metadata: { requestId: "test-request-id", actor: "me" },
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [sub].map(mapSubscription),
        message: "",
      })
    );
  });

  test("should return subscription for specific car id", async () => {
    const ctx = createContext();
    const sub = mockSubscription();
    ctx.listSubscriptions.mockReturnValueOnce([sub]);
    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        car_id: sub.carId,
      },
      headers: ctx.headers,
    });
    expect(ctx.listSubscriptions).toHaveBeenCalledWith({
      filters: {
        carId: [sub.carId],
      },
      count: 50,
      offset: 0,
      metadata: { requestId: "test-request-id", actor: "me" },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [sub].map(mapSubscription),
        message: "",
      })
    );
  });

  test("should return subscriptions for multiple car ids", async () => {
    const ctx = createContext();
    const sub1 = mockSubscription();
    const sub2 = mockSubscription();
    ctx.listSubscriptions.mockReturnValueOnce([sub1, sub2]);
    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        car_id: `${sub1.carId},${sub2.carId}`,
      },
      headers: ctx.headers,
    });
    expect(ctx.listSubscriptions).toHaveBeenCalledWith({
      filters: {
        carId: [sub1.carId, sub2.carId],
      },
      count: 50,
      offset: 0,
      metadata: { requestId: "test-request-id", actor: "me" },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [sub1, sub2].map(mapSubscription),
        message: "",
      })
    );
  });

  test("should return subscriptions for various states", async () => {
    const ctx = createContext();
    const sub1 = mockSubscription({ state: SubscriptionState.CREATED });
    const sub2 = mockSubscription({ state: SubscriptionState.ACTIVE });
    ctx.listSubscriptions.mockReturnValueOnce([sub1, sub2]);
    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        state: "ACTIVE,CREATED",
      },
      headers: ctx.headers,
    });
    expect(ctx.listSubscriptions).toHaveBeenCalledWith({
      filters: {
        state: ["ACTIVE", "CREATED"],
      },
      count: 50,
      offset: 0,
      metadata: { requestId: "test-request-id", actor: "me" },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [sub1, sub2].map(mapSubscription),
        message: "",
      })
    );
  });

  test("should return subscriptions for given contact ids", async () => {
    const ctx = createContext();
    const sub1 = mockSubscription({ contactId: "testCustomer1" });
    const sub2 = mockSubscription({ contactId: "testCustomer2" });
    ctx.listSubscriptions.mockReturnValueOnce([sub1, sub2]);
    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        contact_id: "testCustomer1,testCustomer2",
      },
      headers: ctx.headers,
    });
    expect(ctx.listSubscriptions).toHaveBeenCalledWith({
      filters: {
        contactId: ["testCustomer1", "testCustomer2"],
      },
      count: 50,
      offset: 0,
      metadata: { requestId: "test-request-id", actor: "me" },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [sub1, sub2].map(mapSubscription),
        message: "",
      })
    );
  });

  test("should return subscription for specific subscription id", async () => {
    const ctx = createContext();
    const sub = mockSubscription();
    ctx.listSubscriptions.mockReturnValueOnce([sub]);
    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        subscription_id: sub.id,
      },
      headers: ctx.headers,
    });
    expect(ctx.listSubscriptions).toHaveBeenCalledWith({
      filters: {
        subscriptionId: [sub.id],
      },
      count: 50,
      offset: 0,
      metadata: { requestId: "test-request-id", actor: "me" },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [sub].map(mapSubscription),
        message: "",
      })
    );
  });

  test("should return subscriptions for multiple subscription ids", async () => {
    const ctx = createContext();
    const sub1 = mockSubscription();
    const sub2 = mockSubscription();
    ctx.listSubscriptions.mockReturnValueOnce([sub1, sub2]);
    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        subscription_id: `${sub1.id},${sub2.id}`,
      },
      headers: ctx.headers,
    });
    expect(ctx.listSubscriptions).toHaveBeenCalledWith({
      filters: {
        subscriptionId: [sub1.id, sub2.id],
      },
      count: 50,
      offset: 0,
      metadata: { requestId: "test-request-id", actor: "me" },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [sub1, sub2].map(mapSubscription),
        message: "",
      })
    );
  });

  test("should return subscriptions for given types", async () => {
    const ctx = createContext();
    const sub1 = mockSubscription({ type: SubscriptionType.B2B });
    const sub2 = mockSubscription({ type: SubscriptionType.B2B });
    const sub3 = mockSubscription({ type: SubscriptionType.MINIB2B });
    const sub4 = mockSubscription({ type: SubscriptionType.MINIB2B });
    ctx.listSubscriptions.mockReturnValueOnce([sub1, sub2, sub3, sub4]);
    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        type: "B2B,MINIB2B",
      },
      headers: ctx.headers,
    });
    expect(ctx.listSubscriptions).toHaveBeenCalledWith({
      filters: {
        type: [SubscriptionType.B2B, SubscriptionType.MINIB2B],
      },
      count: 50,
      offset: 0,
      metadata: { requestId: "test-request-id", actor: "me" },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [sub1, sub2, sub3, sub4].map(mapSubscription),
        message: "",
      })
    );
  });
});
