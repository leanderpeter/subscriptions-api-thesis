import axios from "axios";
import HttpCustomerRepository from "~/src/adapters/customer";
import { NotFoundError } from "~/src/domain/types/errors";

/**
 * This is an integration test for HttpCustomerRepository. Remove `.skip` part when needed
 */

describe.skip("HttpCustomerRepository", () => {
  const cssConnection = axios.create({
    baseURL: process.env.CUSTOMERS_SERVICE_BASE_URL || "",
    timeout: 15000,
  });
  const repo = new HttpCustomerRepository(
    cssConnection,
    process.env.CUSTOMERS_SERVICE_API_KEY || ""
  );

  describe("getById", () => {
    test("should return a contact when the request is successful", async () => {
      const customers = await repo.getById("325583752", {
        requestId: "me",
        actor: "Vincent Vega",
      });
      expect(customers).toStrictEqual({
        city: null,
        dateOfBirth: new Date("1970-01-01T00:00:00.000Z"),
        firstName: "Michael",
        id: "325583752",
        internalVerificationDecisionDl: null,
        internalVerificationDecisionId: null,
        lastName: "Kazda",
        street: null,
        zip: null,
      });
    });

    test("should return a 404 when contact does not exist", async () => {
      const customersPromise = repo.getById("non-existent", {
        requestId: "me",
        actor: "Vincent Vega",
      });
      await expect(customersPromise).rejects.toThrow(NotFoundError);
    });
  });
  describe("health", () => {
    test("should return a 200 when all services are up", async () => {
      const health = await repo.health();
      expect(health).toBe("Hello Houston, all services are up!");
    });
  });
});
