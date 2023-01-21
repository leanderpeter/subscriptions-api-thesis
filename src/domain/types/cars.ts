export enum FuelType {
  PETROL = "petrol",
  DIESEL = "diesel",
  ELECTRIC = "electric",
  HYBRID_DIESEL = "hybrid_diesel",
  HYBRID_PETROL = "hybrid_petrol",
  HYBRID_PLUG_IN = "hybrid_plug_in",
}

export type Car = {
  id: string;
  oem: string;
  model: string;
  fuelType: FuelType;
  externalProductId: string;
  registrationData?: {
    licensePlate?: string;
  };
};

export interface CarRepository {
  confirmReservation(
    token: string,
    metadata: {
      requestId: string;
      actor: string;
    }
  ): Promise<string>;
}
