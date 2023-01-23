import { SortOrder } from "~/src/domain/types/subscription";
import { mockSubscriptionEvent } from "~/src/mocks/model";
import { invoke } from "~/src/utils/test-utils";
import { mapSubscription } from "~/src/interfaces/lambda-http/subscriptions/get/handler";
import createHandler from "./handler";

function createContext() {
  const listEventsByFilter = jest.fn();
  return {
    listEventsByFilter,
    handler: createHandler({ listEventsByFilter }),
  };
}

describe("GET /events/?from=&to=&count=&sort=&name=", () => {
  test("missing actor", async () => {
    const ctx = createContext();

    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        from: "2011-10-05T14:48:00.000Z",
      },
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

  test("should return 400 is count is NaN", async () => {
    const ctx = createContext();

    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        from: "2011-10-05T14:48:00.000Z",
        count: "ABC",
      },
      headers: {
        "x-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "count must be a number",
      })
    );
  });

  test("should return 400 if count < 1", async () => {
    const ctx = createContext();

    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        from: "2011-10-05T14:48:00.000Z",
        count: "0",
      },
      headers: {
        "x-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [
          {
            instancePath: "/count",
            schemaPath: "#/properties/count/minimum",
            keyword: "minimum",
            params: { comparison: ">=", limit: 1 },
            message: "must be >= 1",
          },
        ],
        message: "invalid query parameters",
      })
    );
  });

  test("should return 400 if 'from' is invalid date", async () => {
    const ctx = createContext();

    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        from: "13-02-199710:11",
      },
      headers: {
        "x-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [
          {
            instancePath: "/from",
            schemaPath: "#/properties/from/format",
            keyword: "format",
            params: { format: "iso-date-time" },
            message: 'must match format "iso-date-time"',
          },
        ],
        message: "invalid query parameters",
      })
    );
  });

  test("should return 400 if 'sort' is invalid", async () => {
    const ctx = createContext();

    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        sort: "hello",
      },
      headers: {
        "x-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toContain('"instancePath":"/sort');
    expect(res.body).toContain("must be equal to one of the allowed values");
    expect(res.body).toContain('"allowedValues":["asc","desc"]');
  });

  test("should return 400 if event 'name' is invalid", async () => {
    const ctx = createContext();

    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        name: "hello,world",
      },
      headers: {
        "x-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toContain('"instancePath":"/name');
    expect(res.body).toContain("must be equal to one of the allowed values");
    expect(res.body).toContain(
      '"allowedValues":["subscription_created","subscription_canceled","subscription_activated"]'
    );
  });

  test("should return 400 if 'to' < 'from'", async () => {
    const ctx = createContext();

    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        from: "2011-10-05T14:48:00.000Z",
        to: "2011-10-01T14:48:00.000Z",
      },
      headers: {
        "x-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "'to' must be greater than or equal to 'from'",
      })
    );
  });

  test("generic error", async () => {
    const ctx = createContext();
    ctx.listEventsByFilter.mockRejectedValueOnce(new Error("dead"));

    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        from: "2011-10-05T14:48:00.000Z",
      },
      headers: {
        "x-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "something went wrong",
      })
    );
  });

  test("should successfuly list events with default count and sort order", async () => {
    const ctx = createContext();
    const events = [mockSubscriptionEvent(), mockSubscriptionEvent()];
    ctx.listEventsByFilter.mockResolvedValueOnce(events);

    const res = await invoke(ctx.handler, {
      headers: {
        "x-actor": "me",
        "x--request-id": "test-request-id",
      },
    });

    expect(ctx.listEventsByFilter).toHaveBeenCalledWith({
      filters: {},
      count: 50,
      sortOrder: SortOrder.ASCENDING,
      metadata: {
        actor: "me",
        requestId: "test-request-id",
      },
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [
          {
            id: events[0].id,
            name: events[0].name,
            actor: events[0].actor,
            notes: events[0].notes,
            time: events[0].time,
            snapshot: mapSubscription(events[0].snapshot),
            subscription_id: events[0].subscriptionId,
          },
          {
            id: events[1].id,
            name: events[1].name,
            actor: events[1].actor,
            notes: events[1].notes,
            time: events[1].time,
            snapshot: mapSubscription(events[1].snapshot),
            subscription_id: events[1].subscriptionId,
          },
        ],
        message: "",
      })
    );
  });

  test("should successfuly list events with a given from, to, count and sort order", async () => {
    const ctx = createContext();
    const events = [mockSubscriptionEvent(), mockSubscriptionEvent()];
    ctx.listEventsByFilter.mockResolvedValueOnce(events);

    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        sort: "desc",
        count: "10",
        from: "2022-06-09T09:38:38.999Z",
        to: "2022-06-10T09:38:38.999Z",
        name: "subscription_created,subscription_canceled",
      },
      headers: {
        "x-actor": "me",
        "x--request-id": "test-request-id",
      },
    });

    expect(ctx.listEventsByFilter).toHaveBeenCalledWith({
      filters: {
        name: ["subscription_created", "subscription_canceled"],
        from: new Date("2022-06-09T09:38:38.999Z"),
        to: new Date("2022-06-10T09:38:38.999Z"),
      },
      count: 10,
      sortOrder: SortOrder.DESCENDING,
      metadata: {
        actor: "me",
        requestId: "test-request-id",
      },
    });
    expect(res.statusCode).toEqual(200);
  });

  test("should successfuly list events with a given to, count and sort order", async () => {
    const ctx = createContext();
    const events = [mockSubscriptionEvent(), mockSubscriptionEvent()];
    ctx.listEventsByFilter.mockResolvedValueOnce(events);

    const res = await invoke(ctx.handler, {
      queryStringParameters: {
        sort: "asc",
        count: "10",
        to: "2022-06-10T09:38:38.999Z",
        name: "subscription_created,subscription_canceled",
      },
      headers: {
        "x-actor": "me",
        "x--request-id": "test-request-id",
      },
    });

    expect(ctx.listEventsByFilter).toHaveBeenCalledWith({
      filters: {
        name: ["subscription_created", "subscription_canceled"],
        to: new Date("2022-06-10T09:38:38.999Z"),
      },
      count: 10,
      sortOrder: SortOrder.ASCENDING,
      metadata: {
        actor: "me",
        requestId: "test-request-id",
      },
    });
    expect(res.statusCode).toEqual(200);
  });
});
