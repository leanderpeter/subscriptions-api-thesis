import { response, StatusCodes, mapError } from "~/src/utils/response";
import {
  ConflictError,
  InvalidInputError,
  InvalidOperationError,
  NotFoundError,
} from "../domain/types/errors";

describe("response utils", () => {
  describe("response", () => {
    test("should return a http-safe response when all args are passed", () => {
      const data = { test: "value" };
      const message = "success";
      const res = response(StatusCodes.SUCCESS, data, message);
      expect(res).toHaveProperty("statusCode");
      expect(res).toHaveProperty("headers");
      expect(res).toHaveProperty("body");
      expect(res.statusCode).toBe(StatusCodes.SUCCESS);
      expect(res.headers).toHaveProperty("Content-Type");
      expect(res.headers).toHaveProperty("x-finn-request-id");
      expect(res.body).toBe(JSON.stringify({ data, message }));
    });

    test("should return a http-safe response when no optional args are passed", () => {
      const data = {};
      const message = "";
      const res = response(StatusCodes.SUCCESS);
      expect(res).toHaveProperty("statusCode");
      expect(res).toHaveProperty("headers");
      expect(res).toHaveProperty("body");
      expect(res.statusCode).toBe(StatusCodes.SUCCESS);
      expect(res.headers).toHaveProperty("Content-Type");
      expect(res.headers).toHaveProperty("x-finn-request-id");
      expect(res.body).toBe(JSON.stringify({ data, message }));
    });
  });

  describe("mapError", () => {
    const ctx = {
      actor: "jest",
      requestId: "dummy-request-id",
    };

    test("should return 403 on InvalidOperationError", () => {
      const res = mapError(new InvalidOperationError("test"), ctx);
      expect(res.statusCode).toBe(StatusCodes.FORBIDDEN);
    });

    test("should return 404 on NotFoundError", () => {
      const res = mapError(new NotFoundError("test"), ctx);
      expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
    });

    test("should return 409 on ConflictError", () => {
      const res = mapError(new ConflictError("test"), ctx);
      expect(res.statusCode).toBe(StatusCodes.CONFLICT);
    });

    test("should return 400 on InvalidInputError", () => {
      const res = mapError(
        new InvalidInputError("test", "cannot be empty"),
        ctx
      );
      expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });

    test("should return 500 on other errors", () => {
      const res = mapError(new Error("test"), ctx);
      expect(res.statusCode).toBe(StatusCodes.ERROR);
    });
  });
});
