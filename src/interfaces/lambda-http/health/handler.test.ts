import createHandler from "~/src/interfaces/lambda-http/health/handler";
import { Dependencies } from "~/src/domain/system/healthcheck";
import { invoke } from "~/src/utils/test-utils";

describe("health http handler", () => {
  test("successfull health check", async () => {
    const deps: Dependencies = {
      http: {
        health: jest.fn().mockResolvedValue("8.8.8.8"),
      },
      db: {
        health: jest.fn().mockResolvedValue(100),
      },
    };
    const handler = createHandler(deps);
    const response = await invoke(handler, {});
    expect(response).toEqual({
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "x--request-id": "",
      },
      body: JSON.stringify({
        data: {
          db: 100,
          ip: "8.8.8.8",
          version: "dev",
        },
        message: "",
      }),
    });
  });
  test("failing health check", async () => {
    const deps: Dependencies = {
      http: {
        health: jest.fn().mockRejectedValue("death"),
      },
      db: {
        health: jest.fn().mockRejectedValue("death"),
      },
    };
    const handler = createHandler(deps);
    const response = await invoke(handler, {});
    expect(response).toEqual({
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "x--request-id": "",
      },
      body: JSON.stringify({
        data: {
          db: "fail",
          ip: "fail",
          version: "dev",
        },
        message: "",
      }),
    });
  });
});
