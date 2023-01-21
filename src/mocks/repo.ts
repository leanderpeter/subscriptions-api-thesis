import { SubscriptionRepository } from "~/src/domain/types/subscription";
import { CarRepository } from "~/src/domain/types/cars";
import { CustomerRepository } from "~/src/domain/types/customer";

export function mockSubRepository(): jest.Mocked<SubscriptionRepository> {
  return {
    create: jest.fn(),
    getById: jest.fn(),
    listEvents: jest.fn(),
    addEvent: jest.fn(),
    update: jest.fn(),
    list: jest.fn(),
  };
}

export function mockCarRepository(): jest.Mocked<CarRepository> {
  return {
    confirmReservation: jest.fn(),
  };
}

export function mockCustomerRepository(): jest.Mocked<CustomerRepository> {
  return {
    getById: jest.fn(),
  };
}
