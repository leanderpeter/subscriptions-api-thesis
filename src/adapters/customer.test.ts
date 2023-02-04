import moxios from "moxios";
import axios, { AxiosInstance } from "axios";
import HttpCustomerRepository, { mapToCustomer } from "~/src/adapters/customer";
import {
  NotFoundError,
  ServiceUnavailableError,
} from "~/src/domain/types/errors";

describe("customer repository", () => {
  let cssConnection: AxiosInstance;
  let customerRepository: HttpCustomerRepository;
  const baseURL = "http://localhost:3000";

  beforeEach(() => {
    cssConnection = axios.create({
      baseURL,
      timeout: 5000,
    });
    moxios.install(cssConnection);
    customerRepository = new HttpCustomerRepository(cssConnection, "test");
  });

  afterEach(function () {
    moxios.uninstall(cssConnection);
  });

  describe("health", () => {
    test("success", async () => {
      moxios.stubRequest("/api/v2/health", {
        status: 200,
        response: { message: "ok" },
      });
      const output = await customerRepository.health();
      expect(output).toBe("ok");
    });

    test("failure", async () => {
      moxios.stubRequest("/api/v2/health", {
        status: 500,
        response: { data: { message: "fail" } },
      });
      const output = customerRepository.health();
      await expect(output).rejects.toThrow(
        "Request failed with status code 500"
      );
    });
  });

  describe("getById", () => {
    const metadata = {
      requestId: "testRequestId",
      actor: "jest",
    };
    test("should return a customer", async () => {
      moxios.stubRequest("/api/internal/customers/123456/profile", {
        status: 200,
        response: {
          data: {
            id: "123456",
            properties: {
              address: "Prinzregentenplatz, 9",
              city: "Munich",
              date_of_birth: "1992-01-11",
              firstname: "Leander",
              lastname: "Peter",
              zip: "81675",
            },
          },
        },
      });
      const customer = await customerRepository.getById("123456", metadata);
      expect(customer.id).toBe("123456");
      expect(customer.dateOfBirth.toISOString()).toBe(
        new Date("1992-01-11").toISOString()
      );
      expect(customer.firstName).toBe("Leander");
      expect(customer.lastName).toBe("Peter");
      expect(customer.street).toBe("Prinzregentenplatz, 9");
      expect(customer.city).toBe("Munich");
      expect(customer.zip).toBe("81675");
    });

    test("non-existent customer id should throw an error", async () => {
      moxios.stubRequest("/api/internal/customers/unknownCustomerId/profile", {
        status: 404,
        response: {
          data: { message: "Customer<unknownCustomerId> not found" },
        },
      });
      const customerPromise = customerRepository.getById(
        "unknownCustomerId",
        metadata
      );
      await expect(customerPromise).rejects.toThrow(NotFoundError);
    });

    test("should throw an error on any other failure response", async () => {
      moxios.stubRequest("/api/internal/customers/failCustomerId/profile", {
        status: 500,
      });
      const customerPromise = customerRepository.getById(
        "failCustomerId",
        metadata
      );
      await expect(customerPromise).rejects.toThrow(ServiceUnavailableError);
    });

    test("should throw an error on any other customer service error", async () => {
      moxios.stubTimeout("/api/internal/customers/failCustomerId/profile");
      const customerPromise = customerRepository.getById(
        "failCustomerId",
        metadata
      );
      await expect(customerPromise).rejects.toThrow(Error);
    });
  });

  describe("mapToCustomer", () => {
    test("should correctly transform the input to Customer", () => {
      const input = {
        id: "1",
        properties: {
          address: "Rick road 6910",
          city: "Seattle",
          date_of_birth: "1952-04-10T08:54:32.443Z",
          firstname: "Richard",
          lastname: "Sanchez",
          zip: "98105",
          internal_verification_decision_dl: "approved",
          internal_verification_decision_id: "approved",
        },
      };
      const customer = mapToCustomer(input);
      expect(customer).toStrictEqual({
        id: "1",
        firstName: input.properties.firstname,
        lastName: "Sanchez",
        dateOfBirth: new Date(input.properties.date_of_birth),
        street: input.properties.address,
        city: input.properties.city,
        zip: input.properties.zip,
        internalVerificationDecisionDl:
          input.properties.internal_verification_decision_dl,
        internalVerificationDecisionId:
          input.properties.internal_verification_decision_id,
      });
    });
  });
});
