import { AxiosError, AxiosInstance } from "axios";
import { Car, CarRepository, FuelType } from "~/src/domain/types/cars";
import {
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
  InvalidOperationError,
} from "~/src/domain/types/errors";

type CarRecord = {
  id: string;
  oem: string;
  model: string;
  external_product_id: string;
  fuel_type: FuelType;
  registration_data?: {
    license_plate?: string;
  };
};

type ConfirmReservationResponse = {
  data: CarRecord;
};

export function mapToCar(input: CarRecord): Car {
  const car: Car = {
    id: input.id,
    oem: input.oem,
    model: input.model,
    externalProductId: input.external_product_id,
    fuelType: input.fuel_type,
  };
  if (input.registration_data) {
    car.registrationData = {
      licensePlate: input.registration_data?.license_plate,
    };
  }
  return car;
}

class HttpCarRepository implements CarRepository {
  private readonly connection: AxiosInstance;

  constructor(connection: AxiosInstance, apiKey: string) {
    this.connection = connection;
    this.connection.defaults.headers.common["x-api-key"] = apiKey;
  }

  async confirmReservation(
    token: string,
    metadata: {
      requestId: string;
      actor: string;
    }
  ): Promise<string> {
    const url = `/car_reservations/${token}/confirmations`;
    try {
      const response = await this.connection.post(
        url,
        {},
        {
          headers: {
            "x--request-id": metadata.requestId,
            "x-actor": metadata.actor,
          },
        }
      );
      const carId = (<ConfirmReservationResponse>response.data).data.id;
      return carId;
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response) {
        const { status } = axiosErr.response;
        const { message } = axiosErr.response.data as { message: string };
        if (status === 404) {
          throw new NotFoundError(token);
        } else if (status === 409) {
          throw new ConflictError(message);
        } else if (status === 403) {
          throw new InvalidOperationError(message);
        } else {
          throw new ServiceUnavailableError("cars");
        }
      } else {
        throw err;
      }
    }
  }
}

export default HttpCarRepository;
