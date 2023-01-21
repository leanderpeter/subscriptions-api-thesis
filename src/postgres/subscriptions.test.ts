import {
  mapNullableString,
  mapNullableDate,
  mapToSubscription,
  mapToSubscriptionEvent,
  mapToSubscriptionRecord,
} from "~/src/postgres/subscriptions";
import {
  mockSubscriptionRecord,
  mockSubscriptionEventRecord,
  mockSubscription,
} from "~/src/mocks/model";

describe("subscriptions", () => {
  describe("mapNullableField", () => {
    test("should return the field's value", () => {
      expect(mapNullableString("123")).toBe("123");
    });

    test("should return undefined if field is null", () => {
      expect(mapNullableString(null)).toBe(undefined);
    });
  });

  describe("mapNullableDate", () => {
    test("should return date", () => {
      const now = new Date();
      expect(mapNullableDate(now)?.toISOString()).toBe(now.toISOString());
    });

    test("should return undefined if field is null", () => {
      expect(mapNullableDate(null)).toBe(undefined);
    });
  });

  describe("mapToSubscription", () => {
    test("should correctly map SubscriptionRecord to a Subscription without optional fields", () => {
      const sr = mockSubscriptionRecord({
        handover_address_extra: null,
      });
      const sub = mapToSubscription(sr);
      expect(sub).toEqual({
        id: sr.id,
        state: sr.state,
        contactId: sr.contact_id,
        carId: sr.car_id,
        type: sr.type,
        term: sr.term,
        signingDate: new Date(sr.signing_date),
        termType: sr.term_type,
        deposit: sr.deposit,
        amount: sr.amount,
        mileagePackage: sr.mileage_package,
        mileagePackageFee: sr.mileage_package_fee,
        additionalMileageFee: sr.additional_mileage_fee,
        handoverFirstName: sr.handover_firstname,
        handoverLastName: sr.handover_lastname,
        handoverHouseNumber: sr.handover_housenumber,
        handoverStreet: sr.handover_street,
        handoverCity: sr.handover_city,
        handoverZip: sr.handover_zip,
        preferredHandoverDate: new Date(sr.preferred_handover_date),
        createdAt: new Date(sr.created_at),
        updatedAt: new Date(sr.updated_at),
      });
      expect(sub.handoverAddressExtra).toBeUndefined();
    });

    test("should correctly map SubscriptionRecord to a Subscription with optional fields", () => {
      const sr = mockSubscriptionRecord();
      const sub = mapToSubscription(sr);
      expect(sub).toEqual({
        id: sr.id,
        state: sr.state,
        contactId: sr.contact_id,
        carId: sr.car_id,
        type: sr.type,
        term: sr.term,
        signingDate: new Date(sr.signing_date),
        termType: sr.term_type,
        deposit: sr.deposit,
        amount: sr.amount,
        mileagePackage: sr.mileage_package,
        mileagePackageFee: sr.mileage_package_fee,
        additionalMileageFee: sr.additional_mileage_fee,
        handoverFirstName: sr.handover_firstname,
        handoverLastName: sr.handover_lastname,
        handoverHouseNumber: sr.handover_housenumber,
        handoverStreet: sr.handover_street,
        handoverCity: sr.handover_city,
        handoverZip: sr.handover_zip,
        handoverAddressExtra: sr.handover_address_extra,
        preferredHandoverDate: new Date(sr.preferred_handover_date),
        createdAt: new Date(sr.created_at),
        updatedAt: new Date(sr.updated_at),
      });
    });
  });

  describe("mapToSubscriptionEvent", () => {
    test("should correctly map SubscriptionEventRecord to a SubscriptionEvent", () => {
      const ser = mockSubscriptionEventRecord();
      const sub = mapToSubscriptionEvent(ser);
      expect(sub).toEqual({
        id: ser.id,
        name: ser.name,
        actor: ser.actor,
        notes: ser.notes,
        time: ser.time,
        snapshot: mapToSubscription(ser.snapshot),
        subscriptionId: ser.subscription_id,
      });
    });
  });

  describe("mapToSubscriptionRecord", () => {
    test("should correctly map Subscription to a SubscriptionRecord without optional fields", () => {
      const sub = mockSubscription({
        handoverAddressExtra: undefined,
      });
      const sr = mapToSubscriptionRecord(sub);
      expect(sr).toEqual({
        state: sub.state,
        contact_id: sub.contactId,
        car_id: sub.carId,
        type: sub.type,
        term: sub.term,
        term_type: sub.termType,
        deposit: sub.deposit,
        amount: sub.amount,
        mileage_package: sub.mileagePackage,
        mileage_package_fee: sub.mileagePackageFee,
        additional_mileage_fee: sub.additionalMileageFee,
        handover_firstname: sub.handoverFirstName,
        handover_lastname: sub.handoverLastName,
        handover_housenumber: sub.handoverHouseNumber,
        handover_street: sub.handoverStreet,
        handover_city: sub.handoverCity,
        handover_zip: sub.handoverZip,
        preferred_handover_date: sub.preferredHandoverDate,
      });
      expect(sr.handover_address_extra).toBeUndefined();
    });

    test("should correctly map Subscription to a SubscriptionRecord with optional fields", () => {
      const sub = mockSubscription();
      const sr = mapToSubscriptionRecord(sub);
      expect(sr).toEqual({
        state: sub.state,
        contact_id: sub.contactId,
        car_id: sub.carId,
        type: sub.type,
        term: sub.term,
        term_type: sub.termType,
        deposit: sub.deposit,
        amount: sub.amount,
        mileage_package: sub.mileagePackage,
        mileage_package_fee: sub.mileagePackageFee,
        additional_mileage_fee: sub.additionalMileageFee,
        handover_firstname: sub.handoverFirstName,
        handover_lastname: sub.handoverLastName,
        handover_housenumber: sub.handoverHouseNumber,
        handover_address_extra: sub.handoverAddressExtra,
        handover_street: sub.handoverStreet,
        handover_city: sub.handoverCity,
        handover_zip: sub.handoverZip,
        preferred_handover_date: sub.preferredHandoverDate,
      });
    });
  });
});
