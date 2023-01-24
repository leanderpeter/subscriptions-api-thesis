import {
  ConflictError,
  InvalidInputError,
  NotFoundError,
} from "~/src/domain/types/errors";
import { SubscriptionType } from "~/src/domain/types/subscription";
import { mockSubscription } from "~/src/mocks/model";
import { invoke } from "~/src/utils/test-utils";
import createHandler, { Input } from "./handler";

function createContext() {
  const createSubscription = jest.fn();
  const sub = mockSubscription({
    type: SubscriptionType.B2C,
    terminationDate: undefined,
    terminationReason: undefined,
  });
  const input: Input = {
    contact_id: sub.contactId,
    car_reservation_token: "testCarReservationToken",
    type: sub.type,
    term: sub.term,
    signing_date: sub.signingDate.toISOString(),
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
    handover_address_extra: sub.handoverAddressExtra,
    preferred_handover_date: sub.preferredHandoverDate.toISOString(),
  };
  const event = {
    headers: {
      "x-actor": "jest",
    },
    body: JSON.stringify(input),
  };
  return {
    createSubscription,
    event,
    subscription: sub,
    input,
    handler: createHandler({ createSubscription }),
  };
}

describe("POST /subscriptions", () => {
  test("missing actor", async () => {
    const ctx = createContext();
    const res = await invoke(ctx.handler, {
      headers: {},
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "header x-actor is required",
      })
    );
  });

  test("generic error", async () => {
    const ctx = createContext();
    ctx.createSubscription.mockRejectedValueOnce(new Error("dead"));
    const res = await invoke(ctx.handler, ctx.event);
    expect(res.statusCode).toEqual(500);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "something went wrong",
      })
    );
  });

  test("not found", async () => {
    const ctx = createContext();
    ctx.createSubscription.mockRejectedValueOnce(
      new NotFoundError("carReservationToken")
    );
    const res = await invoke(ctx.handler, ctx.event);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "carReservationToken was not found",
      })
    );
  });

  test("car reservation conflict", async () => {
    const ctx = createContext();
    ctx.createSubscription.mockRejectedValueOnce(
      new ConflictError("confirmReservation<testToken}>")
    );
    const res = await invoke(ctx.handler, ctx.event);
    expect(res.statusCode).toEqual(409);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: "confirmReservation<testToken}> caused a conflict",
      })
    );
  });

  test("duplicate ID conflict", async () => {
    const ctx = createContext();
    const msg = "create Subscription<testID>";
    ctx.createSubscription.mockRejectedValueOnce(new ConflictError(msg));
    const res = await invoke(ctx.handler, ctx.event);
    expect(res.statusCode).toEqual(409);
    expect(res.body).toEqual(
      JSON.stringify({
        data: {},
        message: `${msg} caused a conflict`,
      })
    );
  });

  describe("invalid inputs", () => {
    test("missing body", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        headers: ctx.event.headers,
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "body is not valid json",
        })
      );
    });

    test("invalid body", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        body: "invalidJSON",
        headers: ctx.event.headers,
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "body is not valid json",
        })
      );
    });

    test("invalid property values ", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        headers: ctx.event.headers,
        body: JSON.stringify({
          ...ctx.input,
          contact_id:
            "4237657923446578465249872y895728947598347658967349856723845ryueirhge89rfu78w9uf425243543",
        }),
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toContain("missing/invalid properties");
      expect(res.body).toContain("must NOT have more than 50 characters");
    });

    test("missing required property ", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        headers: ctx.event.headers,
        body: JSON.stringify({
          type: "NEW_TYPE",
          term: -1,
        }),
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toContain("missing/invalid properties");
      expect(res.body).toContain("must have required property 'contact_id'");
    });

    test("invalid id property", async () => {
      const ctx = createContext();
      const res = await invoke(ctx.handler, {
        headers: ctx.event.headers,
        body: JSON.stringify({
          ...ctx.input,
          id: "qr42353464575687678769785434256475869809787564534234123543647wer34645758674ergdfgdfhsxfasee456456e",
        }),
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toContain("missing/invalid properties");
      expect(res.body).toContain("must NOT have more than 50 characters");
    });

    test("customer not found", async () => {
      const ctx = createContext();
      ctx.createSubscription.mockRejectedValueOnce(
        new InvalidInputError("contactId", "not found")
      );
      const res = await invoke(ctx.handler, ctx.event);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message: "contactId is invalid: not found",
        })
      );
    });

    test("customer not verified", async () => {
      const ctx = createContext();
      ctx.createSubscription.mockRejectedValueOnce(
        new InvalidInputError(
          "contactId",
          "Internal verification decision: Customer is not verified"
        )
      );
      const res = await invoke(ctx.handler, ctx.event);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {},
          message:
            "contactId is invalid: Internal verification decision: Customer is not verified",
        })
      );
    });
  });

  describe("success", () => {
    test("passing no id should generate one", async () => {
      const ctx = createContext();
      const sub = ctx.subscription;
      ctx.createSubscription.mockResolvedValueOnce(sub);
      const res = await invoke(ctx.handler, ctx.event);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {
            id: sub.id,
            state: sub.state,
            contact_id: sub.contactId,
            car_id: sub.carId,
            type: sub.type,
            term: sub.term,
            signing_date: sub.signingDate,
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
            handover_address_extra: sub.handoverAddressExtra,
            preferred_handover_date: sub.preferredHandoverDate,
            created_at: sub.createdAt,
            updated_at: sub.updatedAt,
          },
          message: "",
        })
      );
    });

    test("passing an id should use it as the id field", async () => {
      const ctx = createContext();
      const sub = ctx.subscription;
      ctx.createSubscription.mockResolvedValueOnce(sub);
      const res = await invoke(ctx.handler, {
        ...ctx.event,
        body: JSON.stringify({ ...ctx.input, id: sub.id }),
      });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(
        JSON.stringify({
          data: {
            id: sub.id,
            state: sub.state,
            contact_id: sub.contactId,
            car_id: sub.carId,
            type: sub.type,
            term: sub.term,
            signing_date: sub.signingDate,
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
            handover_address_extra: sub.handoverAddressExtra,
            preferred_handover_date: sub.preferredHandoverDate,
            created_at: sub.createdAt,
            updated_at: sub.updatedAt,
          },
          message: "",
        })
      );
    });
  });
});
