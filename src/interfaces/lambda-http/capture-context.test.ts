import { APIGatewayEvent, Context } from "aws-lambda";
import {
  createTraceId,
  captureEventContext,
} from "~/src/interfaces/lambda-http/capture-context";

describe("createTraceId", () => {
  test("returns a correlation id if passed as argument", () => {
    const input = "my-unique-trace-id";
    const id = createTraceId(input);
    expect(id).toBe(input);
  });
  test("returns a new uuid if no arguments are passed", () => {
    const id = createTraceId();
    expect(id).toBeTruthy();
  });
});

describe("captureEventContext", () => {
  test("returns empty string for actor if no headers and context are passed as args", () => {
    const ctx = captureEventContext();
    expect(ctx.actor).toEqual("");
  });

  test("creates a unique request id if no headers and context are passed as args", () => {
    const ctx = captureEventContext();
    expect(ctx.requestId).toBeTruthy();
  });

  test("returns the actor and request id from headers", () => {
    const headers: APIGatewayEvent["headers"] = {
      "x-actor": "jest",
      "x--request-id": "test-request-id",
    };
    const ctx = captureEventContext(headers);
    expect(ctx).toStrictEqual({
      actor: "jest",
      requestId: "test-request-id",
    });
  });

  test("returns the request id from context", () => {
    const headers: APIGatewayEvent["headers"] = {
      "x-actor": "jest",
    };
    const context = {
      awsRequestId: "aws-test-1d-1234",
    } as unknown as Context;
    const ctx = captureEventContext(headers, context);
    expect(ctx).toStrictEqual({
      actor: "jest",
      requestId: "aws-test-1d-1234",
    });
  });
});
