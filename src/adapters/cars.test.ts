import moxios from "moxios";
import axios, { AxiosInstance } from "axios";
import HttpCarRepository, { mapToCar } from "~/src/adapters/cars";
import {
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
  InvalidOperationError,
} from "~/src/domain/types/errors";
import { FuelType } from "~/src/domain/types/cars";

describe("cars repository", () => {
  describe("mapToCar", () => {
    test("should return a car without optional fields", () => {
      const input = {
        id: "1",
        oem: "BMW",
        model: "X5",
        external_product_id: "bmw_x5_black",
        fuel_type: FuelType.DIESEL,
      };
      const car = mapToCar(input);
      expect(car).toStrictEqual({
        id: input.id,
        oem: input.oem,
        model: input.model,
        externalProductId: input.external_product_id,
        fuelType: input.fuel_type,
      });
    });

    test("should return a car with optional fields", () => {
      const input = {
        id: "2",
        oem: "BMW",
        model: "X5",
        external_product_id: "bmw_x5_black",
        fuel_type: FuelType.DIESEL,
        registration_data: { license_plate: "TEST 001" },
      };
      const car = mapToCar(input);
      expect(car).toStrictEqual({
        id: input.id,
        oem: input.oem,
        model: input.model,
        externalProductId: input.external_product_id,
        fuelType: input.fuel_type,
        registrationData: {
          licensePlate: input.registration_data.license_plate,
        },
      });
    });
  });

  describe("confirmReservation", () => {
    let connection: AxiosInstance;
    let carRepository: HttpCarRepository;
    const metadata = {
      requestId: "testRequestId",
      actor: "jest",
    };

    beforeEach(() => {
      connection = axios.create({
        baseURL: "http://localhost:3000",
        timeout: 5000,
      });
      moxios.install(connection);
      carRepository = new HttpCarRepository(connection, "test");
    });

    afterEach(() => {
      moxios.uninstall(connection);
    });

    test("valid token should return a car id", async () => {
      moxios.stubRequest("/car_reservations/testToken/confirmations", {
        status: 200,
        response: { data: { id: "testCarId" } },
      });
      const carId = await carRepository.confirmReservation(
        "testToken",
        metadata
      );
      expect(carId).toBe("testCarId");
    });

    test("invalid token should throw an error", async () => {
      moxios.stubRequest("/car_reservations/invalidTestToken/confirmations", {
        status: 404,
        response: {
          message: "token not found",
        },
      });
      const carIdPromise = carRepository.confirmReservation(
        "invalidTestToken",
        metadata
      );
      await expect(carIdPromise).rejects.toThrow(NotFoundError);
    });

    test("used token should throw an error", async () => {
      moxios.stubRequest("/car_reservations/usedTestToken/confirmations", {
        status: 409,
        response: {
          message: "token already used",
        },
      });
      const carIdPromise = carRepository.confirmReservation(
        "usedTestToken",
        metadata
      );
      await expect(carIdPromise).rejects.toThrow(ConflictError);
    });

    test("expired token should throw an error", async () => {
      moxios.stubRequest("/car_reservations/expiredTestToken/confirmations", {
        status: 403,
        response: {
          message: "cannot confirm reservation, the token has expired.",
        },
      });
      const carIdPromise = carRepository.confirmReservation(
        "expiredTestToken",
        metadata
      );
      await expect(carIdPromise).rejects.toThrow(InvalidOperationError);
    });

    test("should throw an error on any other failure response", async () => {
      moxios.stubRequest("/car_reservations/failTestToken/confirmations", {
        status: 500,
        response: {
          message: "internal server error",
        },
      });
      const carIdPromise = carRepository.confirmReservation(
        "failTestToken",
        metadata
      );
      await expect(carIdPromise).rejects.toThrow(ServiceUnavailableError);
    });

    test("should throw an error on any other car service error", async () => {
      moxios.stubTimeout("/car_reservations/failTestToken/confirmations");
      const carIdPromise = carRepository.confirmReservation(
        "failTestToken",
        metadata
      );
      await expect(carIdPromise).rejects.toThrow(Error);
    });
  });
});
