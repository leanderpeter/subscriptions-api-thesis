import { SubscriptionState } from "~/src/domain/types/subscription";
import { mockSubscription } from "~/src/mocks/model";
import { invoke } from "~/src/utils/test-utils";
import createHandler from "~/src/interfaces/lambda-http/subscriptions/put-state/handler";

function createContext() {
  const markAsActive = jest.fn();
  const markAsCanceled = jest.fn();
  const markAsStopped = jest.fn();
  const markAsInactive = jest.fn();
  const markAsEnded = jest.fn();
  return {
    markAsActive,
    markAsCanceled,
    markAsStopped,
    markAsInactive,
    markAsEnded,
    handler: createHandler({
      markAsActive,
      markAsCanceled,
      markAsStopped,
      markAsInactive,
      markAsEnded,
    }),
  };
}

describe("PUT /subscriptions/{id}/state", () => {
  describe("Validation", () => {
    test("missing id", async () => {
      const ctx = createContext();

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: undefined,
        },
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "missing id",
        })
      );
    });

    test("missing actor", async () => {
      const ctx = createContext();

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {},
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "header x-finn-actor is required",
        })
      );
    });

    test("missing body", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "body is not a valid json",
        })
      );
    });

    test("invalid body", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        body: "invalidJSON",
        headers: {
          "x-finn-actor": "me",
        },
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "body is not a valid json",
        })
      );
    });

    test("invalid property values ", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          termination_reason: "Because of it",
        }),
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toContain("missing/invalid properties");
      expect(res.body).toContain("must have required property 'state'");
    });
  });

  describe("mark-as-active", () => {
    test("generic error", async () => {
      const ctx = createContext();
      ctx.markAsActive.mockRejectedValueOnce(new Error("dead"));

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          state: "ACTIVE",
        }),
      });

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "something went wrong",
        })
      );
    });
    test("success", async () => {
      const ctx = createContext();
      const sub = mockSubscription({ state: SubscriptionState.ACTIVE });
      ctx.markAsActive.mockResolvedValueOnce(sub);

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          state: "ACTIVE",
        }),
      });

      expect(res.statusCode).toEqual(200);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(JSON.parse(res.body)["data"]["state"]).toEqual("ACTIVE");
    });
  });

  describe("mark-as-canceled", () => {
    test("generic error", async () => {
      const ctx = createContext();
      ctx.markAsCanceled.mockRejectedValueOnce(new Error("dead"));

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          termination_reason: "Canceled before handover",
          termination_date: "2022-06-09T09:38:38.999Z",
          state: "CANCELED",
        }),
      });

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "something went wrong",
        })
      );
    });

    test("success", async () => {
      const ctx = createContext();
      const sub = mockSubscription({
        state: SubscriptionState.CANCELED,
        terminationDate: new Date("2022-06-09T09:38:38.999Z"),
        terminationReason: "Just like that man",
      });
      ctx.markAsCanceled.mockResolvedValueOnce(sub);

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          termination_reason: sub.terminationReason,
          termination_date: sub.terminationDate?.toISOString(),
          state: "CANCELED",
        }),
      });

      expect(res.statusCode).toEqual(200);
      const body = JSON.parse(res.body) as { data: Record<string, unknown> };
      const { data } = body;
      expect(data.state).toEqual("CANCELED");
      expect(data.termination_date).toEqual("2022-06-09T09:38:38.999Z");
      expect(data.termination_reason).toEqual("Just like that man");
    });

    test("missing termination info", async () => {
      const ctx = createContext();

      const sub = mockSubscription({ state: SubscriptionState.CANCELED });
      ctx.markAsCanceled.mockResolvedValueOnce(sub);

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          state: "CANCELED",
        }),
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "missing termination information",
        })
      );
    });
  });

  describe("mark-as-stopped", () => {
    test("generic error", async () => {
      const ctx = createContext();
      ctx.markAsStopped.mockRejectedValueOnce(new Error("dead"));

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          termination_reason:
            "Car got crashed and remaining parts got sold on Ebay",
          termination_date: "2022-06-09T09:38:38.999Z",
          state: "STOPPED",
        }),
      });

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "something went wrong",
        })
      );
    });

    test("success", async () => {
      const ctx = createContext();
      const sub = mockSubscription({
        state: SubscriptionState.STOPPED,
        terminationDate: new Date("2022-06-09T09:38:38.999Z"),
        terminationReason:
          "Car got crashed and remaining parts got sold on Ebay",
      });
      ctx.markAsStopped.mockResolvedValueOnce(sub);

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          termination_reason: sub.terminationReason,
          termination_date: sub.terminationDate?.toISOString(),
          state: "STOPPED",
        }),
      });

      expect(res.statusCode).toEqual(200);
      const body = JSON.parse(res.body) as { data: Record<string, unknown> };
      const { data } = body;
      expect(data.state).toEqual("STOPPED");
      expect(data.termination_date).toEqual("2022-06-09T09:38:38.999Z");
      expect(data.termination_reason).toEqual(
        "Car got crashed and remaining parts got sold on Ebay"
      );
    });

    test("missing termination info", async () => {
      const ctx = createContext();

      const sub = mockSubscription({ state: SubscriptionState.STOPPED });
      ctx.markAsStopped.mockResolvedValueOnce(sub);

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          state: "STOPPED",
        }),
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "missing termination information",
        })
      );
    });
  });
  describe("mark-as-inactive", () => {
    test("generic error", async () => {
      const ctx = createContext();
      ctx.markAsInactive.mockRejectedValueOnce(new Error("dead"));

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          state: "INACTIVE",
        }),
      });

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "something went wrong",
        })
      );
    });
    test("success", async () => {
      const ctx = createContext();
      const sub = mockSubscription({ state: SubscriptionState.INACTIVE });
      ctx.markAsInactive.mockResolvedValueOnce(sub);

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          state: "INACTIVE",
        }),
      });

      expect(res.statusCode).toEqual(200);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(JSON.parse(res.body)["data"]["state"]).toEqual("INACTIVE");
    });
  });
  describe("mark-as-ended", () => {
    test("generic error", async () => {
      const ctx = createContext();
      ctx.markAsEnded.mockRejectedValueOnce(new Error("dead"));

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          state: "ENDED",
        }),
      });

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "something went wrong",
        })
      );
    });
    test("success", async () => {
      const ctx = createContext();
      const sub = mockSubscription({ state: SubscriptionState.ENDED });
      ctx.markAsEnded.mockResolvedValueOnce(sub);

      const res = await invoke(ctx.handler, {
        pathParameters: {
          id: "123",
        },
        headers: {
          "x-finn-actor": "me",
        },
        body: JSON.stringify({
          state: "ENDED",
        }),
      });

      expect(res.statusCode).toEqual(200);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(JSON.parse(res.body)["data"]["state"]).toEqual("ENDED");
    });
  });
});
