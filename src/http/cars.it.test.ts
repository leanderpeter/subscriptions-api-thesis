import axios from "axios";
import HttpCarRepository from "~/src/http/cars";

/**
 * This is an integration test for CarService. Remove `.skip` part when needed
 */

describe.skip("HttpCarRepository", () => {
  const httpCarConnection = axios.create({
    baseURL: process.env.CARS_SERVICE_BASE_URL,
    timeout: 5000,
  });
  const repo = new HttpCarRepository(
    httpCarConnection,
    process.env.CARS_SERVICE_API_KEY || ""
  );

  describe("confirmReservation", () => {
    test("should confirm a reservation token and return a carId", async () => {
      const carId = await repo.confirmReservation(
        "df75771b-5ea8-4782-bd3c-e872dcabf62f:finn-retooltest4",
        {
          requestId: "",
          actor: "customer.product.tech@finn.auto",
        }
      );
      expect(carId).toBe("finn-retooltest4");
    });
  });
});
