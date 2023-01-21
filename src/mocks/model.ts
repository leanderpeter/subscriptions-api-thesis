import faker from "@faker-js/faker";
import {
  Subscription,
  SubscriptionEvent,
  SubscriptionEventName,
  SubscriptionState,
  SubscriptionTermType,
  SubscriptionType,
} from "~/src/domain/types/subscription";
import {
  Customer,
  CustomerVerificationStates,
} from "~/src/domain/types/customer";
import {
  SubscriptionEventRecord,
  SubscriptionRecord,
} from "~/src/postgres/subscriptions";

export function mockSubscription(
  sub: Partial<Subscription> = {}
): Subscription {
  return {
    id: `${Math.random()}-${Date.now()}`,
    state: faker.random.arrayElement(Object.values(SubscriptionState)),
    contactId: faker.datatype.uuid(),
    carId: faker.datatype.uuid(),
    type: faker.random.arrayElement(Object.values(SubscriptionType)),
    term: faker.datatype.number(),
    signingDate: faker.datatype.datetime(),
    termType: faker.random.arrayElement(Object.values(SubscriptionTermType)),
    deposit: faker.datatype.number(),
    amount: faker.datatype.number(),
    mileagePackage: faker.datatype.number(),
    mileagePackageFee: faker.datatype.number(),
    additionalMileageFee: faker.datatype.number({ min: 1, max: 100 }),
    handoverFirstName: faker.name.firstName(),
    handoverLastName: faker.name.lastName(),
    handoverHouseNumber: String(faker.datatype.number({ min: 1, max: 100 })),
    handoverStreet: faker.address.streetName(),
    handoverCity: faker.address.city(),
    handoverZip: faker.address.zipCode(),
    handoverAddressExtra: faker.address.secondaryAddress(),
    preferredHandoverDate: faker.datatype.datetime(),
    terminationDate: faker.datatype.datetime(),
    terminationReason: faker.datatype.string(120),
    createdAt: faker.datatype.datetime(),
    updatedAt: faker.datatype.datetime(),
    ...sub,
  };
}

export function mockSubscriptionEvent(
  sub: Partial<SubscriptionEvent> = {}
): SubscriptionEvent {
  return {
    id: `${Math.random()}-${Date.now()}`,
    name: faker.random.arrayElement([
      SubscriptionEventName.SUBSCRIPTION_CREATED,
    ]),
    actor: faker.datatype.string(),
    notes: faker.datatype.string(),
    time: faker.datatype.datetime(),
    snapshot: mockSubscription(),
    subscriptionId: faker.datatype.string(),
    ...sub,
  };
}

export function mockCustomer(customer: Partial<Customer> = {}): Customer {
  return {
    id: faker.datatype.uuid(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    dateOfBirth: faker.date.past(23),
    street: faker.address.streetName(),
    city: faker.address.city(),
    zip: faker.address.zipCode(),
    internalVerificationDecisionDl: faker.random.arrayElement(
      Object.values(CustomerVerificationStates)
    ),
    internalVerificationDecisionId: faker.random.arrayElement(
      Object.values(CustomerVerificationStates)
    ),
    ...customer,
  };
}

export function mockSubscriptionRecord(
  sr: Partial<SubscriptionRecord> = {}
): SubscriptionRecord {
  return {
    id: faker.datatype.uuid(),
    state: faker.random.arrayElement(Object.values(SubscriptionState)),
    contact_id: faker.datatype.uuid(),
    car_id: faker.datatype.uuid(),
    type: faker.random.arrayElement(Object.values(SubscriptionType)),
    term: faker.datatype.number(),
    signing_date: faker.datatype.datetime(),
    term_type: faker.random.arrayElement(Object.values(SubscriptionTermType)),
    deposit: faker.datatype.number(),
    amount: faker.datatype.number(),
    mileage_package: faker.datatype.number(),
    mileage_package_fee: faker.datatype.number(),
    additional_mileage_fee: faker.datatype.number({ min: 1, max: 100 }),
    handover_firstname: faker.name.firstName(),
    handover_lastname: faker.name.lastName(),
    handover_housenumber: String(faker.datatype.number({ min: 1, max: 100 })),
    handover_street: faker.address.streetName(),
    handover_city: faker.address.city(),
    handover_zip: faker.address.zipCode(),
    handover_address_extra: faker.address.secondaryAddress(),
    preferred_handover_date: faker.datatype.datetime(),
    created_at: faker.datatype.datetime(),
    updated_at: faker.datatype.datetime(),
    ...sr,
  };
}

export function mockSubscriptionEventRecord(
  ser: Partial<SubscriptionEventRecord> = {}
): SubscriptionEventRecord {
  return {
    id: faker.datatype.uuid(),
    name: faker.random.arrayElement(Object.values(SubscriptionEventName)),
    actor: faker.datatype.string(),
    notes: faker.datatype.string(),
    time: faker.datatype.datetime(),
    snapshot: mockSubscriptionRecord(),
    subscription_id: faker.datatype.string(),
    ...ser,
  };
}

export function mockIdArray(len: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < len; i++) {
    ids[i] = faker.datatype.uuid();
  }

  return ids;
}
