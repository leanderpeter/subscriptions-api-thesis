import { APIGatewayProxyHandler } from "aws-lambda";
import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";
import {
  CreateSubscription,
  CreateSubscriptionActionInput,
} from "~/src/domain/subscriptions/create-subscription";
import {
  Money,
  SubscriptionType,
  SubscriptionTermType,
} from "~/src/domain/types/subscription";
import { mapError, response, StatusCodes } from "~/src/utils/response";
import { captureEventContext } from "~/src/interfaces/lambda-http/capture-context";
import { mapSubscription } from "~/src/interfaces/lambda-http/subscriptions/get/handler";

export interface Input {
  id?: string;
  contact_id: string;
  car_reservation_token: string;
  type: SubscriptionType;
  term: number;
  signing_date: string;
  term_type: SubscriptionTermType;
  deposit: Money;
  amount: Money;
  mileage_package: number;
  mileage_package_fee: Money;
  additional_mileage_fee: Money;
  handover_firstname: string;
  handover_lastname: string;
  handover_housenumber: string;
  handover_street: string;
  handover_city: string;
  handover_zip: string;
  handover_address_extra?: string;
  preferred_handover_date: string;
}

const inputSchema: JSONSchemaType<Input> = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1, maxLength: 50, nullable: true },
    contact_id: { type: "string", minLength: 1, maxLength: 50 },
    car_reservation_token: { type: "string", minLength: 1, maxLength: 100 },
    type: {
      type: "string",
      enum: [
        SubscriptionType.B2B,
        SubscriptionType.B2C,
        SubscriptionType.MINIB2B,
      ],
    },
    term: { type: "number", minimum: 1 },
    signing_date: { type: "string", format: "iso-date-time" },
    term_type: {
      type: "string",
      enum: [SubscriptionTermType.FIXED, SubscriptionTermType.OPEN_ENDED],
    },
    deposit: { type: "number", minimum: 0 },
    amount: { type: "number", minimum: 0 },
    mileage_package: { type: "number", minimum: 0 },
    mileage_package_fee: { type: "number", minimum: 0 },
    additional_mileage_fee: { type: "number", minimum: 0 },
    handover_firstname: { type: "string", minLength: 1, maxLength: 100 },
    handover_lastname: { type: "string", minLength: 1, maxLength: 100 },
    handover_housenumber: { type: "string", minLength: 1, maxLength: 100 },
    handover_street: { type: "string", minLength: 1, maxLength: 100 },
    handover_city: { type: "string", minLength: 1, maxLength: 100 },
    handover_zip: { type: "string", minLength: 1, maxLength: 100 },
    handover_address_extra: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      nullable: true,
    },
    preferred_handover_date: {
      type: "string",
      format: "iso-date-time",
    },
  },
  required: [
    "contact_id",
    "car_reservation_token",
    "type",
    "term",
    "signing_date",
    "term_type",
    "deposit",
    "amount",
    "mileage_package",
    "mileage_package_fee",
    "additional_mileage_fee",
    "handover_firstname",
    "handover_lastname",
    "handover_housenumber",
    "handover_street",
    "handover_city",
    "handover_zip",
    "preferred_handover_date",
  ],
};

const ajv = new Ajv();
addFormats(ajv);
const validateInput = ajv.compile(inputSchema);

export interface Dependencies {
  createSubscription: CreateSubscription;
}

export default function createHandler(
  deps: Dependencies
): APIGatewayProxyHandler {
  return async (event, context) => {
    const ctx = captureEventContext(event.headers, context);
    if (!ctx.actor) {
      return response(
        StatusCodes.BAD_REQUEST,
        {},
        "header x-actor is required",
        ctx
      );
    }
    let input: Input;
    try {
      input = JSON.parse(event.body || "") as Input;
    } catch (e) {
      return response(
        StatusCodes.BAD_REQUEST,
        {},
        "body is not valid json",
        ctx
      );
    }
    if (!validateInput(input)) {
      return response(
        StatusCodes.BAD_REQUEST,
        {
          errors: validateInput.errors,
        },
        "missing/invalid properties",
        ctx
      );
    }

    const actionInput: CreateSubscriptionActionInput = {
      subscription: {
        id: input.id,
        contactId: input.contact_id,
        type: input.type,
        term: input.term,
        signingDate: new Date(input.signing_date),
        termType: input.term_type,
        deposit: input.deposit,
        amount: input.amount,
        mileagePackage: input.mileage_package,
        mileagePackageFee: input.mileage_package_fee,
        additionalMileageFee: input.additional_mileage_fee,
        handoverFirstName: input.handover_firstname,
        handoverLastName: input.handover_lastname,
        handoverHouseNumber: input.handover_housenumber,
        handoverStreet: input.handover_street,
        handoverCity: input.handover_city,
        handoverZip: input.handover_zip,
        handoverAddressExtra: input.handover_address_extra,
        preferredHandoverDate: new Date(input.preferred_handover_date),
        carReservationToken: input.car_reservation_token,
      },
      metadata: ctx,
    };
    try {
      const sub = await deps.createSubscription(actionInput);
      return response(StatusCodes.CREATED, mapSubscription(sub), "", ctx);
    } catch (err) {
      return mapError(err, ctx);
    }
  };
}
