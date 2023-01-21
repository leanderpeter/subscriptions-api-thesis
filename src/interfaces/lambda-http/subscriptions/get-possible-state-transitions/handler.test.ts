import { invoke } from "~/src/utils/test-utils";
import createHandler from "./handler";

function createContext() {
  const listPossibleStateTransitions = jest.fn();
  return {
    listPossibleStateTransitions,
    handler: createHandler({ listPossibleStateTransitions }),
  };
}

describe("GET /subscriptions/{id}/state_transitions", () => {
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

  test("generic error", async () => {
    const ctx = createContext();
    ctx.listPossibleStateTransitions.mockRejectedValueOnce(new Error("dead"));

    const res = await invoke(ctx.handler, {
      pathParameters: {
        id: "123",
      },
      headers: {
        "x-finn-actor": "me",
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

  test("no transitions", async () => {
    const ctx = createContext();
    ctx.listPossibleStateTransitions.mockResolvedValueOnce([]);

    const res = await invoke(ctx.handler, {
      pathParameters: {
        id: "123",
      },
      headers: {
        "x-finn-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: [],
        message: "",
      })
    );
  });

  test("success", async () => {
    const ctx = createContext();
    const possible_transitions = ["CANCELED", "ACTIVE"];
    ctx.listPossibleStateTransitions.mockResolvedValueOnce(
      possible_transitions
    );

    const res = await invoke(ctx.handler, {
      pathParameters: {
        id: "123",
      },
      headers: {
        "x-finn-actor": "me",
      },
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(
      JSON.stringify({
        data: possible_transitions,
        message: "",
      })
    );
  });
});
