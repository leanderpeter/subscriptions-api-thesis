import { APIGatewayProxyHandler } from "aws-lambda";
import { ListSubscriptions, Input } from "~/src/domain/subscriptions/list";
import { captureEventContext } from "~/src/interfaces/lambda-http/capture-context";
import { mapError, response, StatusCodes } from "~/src/utils/response";
import { mapSubscription } from "~/src/interfaces/lambda-http/subscriptions/get/handler";
import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";
import {
  SubscriptionState,
  SubscriptionType,
} from "~/src/domain/types/subscription";

type RequestParameters = {
  state?: SubscriptionState[];
  carId?: string[];
  contactId?: string[];
  subscriptionId?: string[];
  type?: SubscriptionType[];
  count?: number;
  offset?: number;
};

const DEFAULT_COUNT = 50;
const DEFAULT_OFFSET = 0;

const inputSchema: JSONSchemaType<RequestParameters> = {
  type: "object",
  properties: {
    state: {
      type: "array",
      items: {
        type: "string",
        enum: [
          SubscriptionState.CREATED,
          SubscriptionState.ACTIVE,
          SubscriptionState.CANCELED,
          SubscriptionState.STOPPED,
          SubscriptionState.INACTIVE,
          SubscriptionState.ENDED,
        ],
      },
      nullable: true,
    },
    type: {
      type: "array",
      items: {
        type: "string",
        enum: [
          SubscriptionType.B2B,
          SubscriptionType.B2C,
          SubscriptionType.MINIB2B,
        ],
      },
      nullable: true,
    },
    carId: {
      type: "array",
      items: {
        type: "string",
      },
      nullable: true,
    },
    contactId: {
      type: "array",
      items: {
        type: "string",
      },
      nullable: true,
    },
    subscriptionId: {
      type: "array",
      items: {
        type: "string",
      },
      nullable: true,
    },
    count: { type: "number", minimum: 1, nullable: true },
    offset: { type: "number", minimum: 0, nullable: true },
  },
  required: [],
};

const ajv = new Ajv();
addFormats(ajv);
const validateInput = ajv.compile(inputSchema);

export interface Dependencies {
  listSubscriptions: ListSubscriptions;
}

/**
 * Determines the number of records that are to be requested from the datasource
 */
export function getReadCount(
  httpInput: RequestParameters,
  defaultValue = DEFAULT_COUNT
): number {
  if (httpInput.count) {
    // The value of count has maximum priority if passed by the user
    return httpInput.count;
  }
  // Otherwise the count should be the the length of the largest filter or the default value
  return Math.max(
    ...[
      defaultValue,
      httpInput.carId ? httpInput.carId.length : -1,
      httpInput.contactId ? httpInput.contactId.length : -1,
      httpInput.subscriptionId ? httpInput.subscriptionId.length : -1,
    ]
  );
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
        "header x-finn-actor is required",
        ctx
      );
    }
    const { state, car_id, contact_id, subscription_id, count, offset, type } =
      event.queryStringParameters || {};
    const httpInput: RequestParameters = {};
    if (state) {
      httpInput.state = state.split(",") as SubscriptionState[];
    }
    if (car_id) {
      httpInput.carId = car_id.split(",");
    }
    if (contact_id) {
      httpInput.contactId = contact_id.split(",");
    }
    if (subscription_id) {
      httpInput.subscriptionId = subscription_id.split(",");
    }
    if (type) {
      httpInput.type = type.split(",") as SubscriptionType[];
    }
    if (count) {
      httpInput.count = Number(count);
    }
    if (offset) {
      httpInput.offset = Number(offset);
    }
    if (!validateInput(httpInput)) {
      return response(
        StatusCodes.BAD_REQUEST,
        {
          errors: validateInput.errors,
        },
        "missing/invalid properties",
        ctx
      );
    }

    const readCount = getReadCount(httpInput, DEFAULT_COUNT);
    try {
      const input: Input = {
        filters: {
          carId: httpInput.carId,
          state: httpInput.state,
          contactId: httpInput.contactId,
          subscriptionId: httpInput.subscriptionId,
          type: httpInput.type,
        },
        count: readCount,
        offset: httpInput.offset || DEFAULT_OFFSET,
        metadata: ctx,
      };
      const subs = await deps.listSubscriptions(input);
      return response(StatusCodes.SUCCESS, subs.map(mapSubscription), "", ctx);
    } catch (err) {
      return mapError(err, ctx);
    }
  };
}
