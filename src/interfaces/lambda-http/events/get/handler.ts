import { APIGatewayProxyHandler } from "aws-lambda";
import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";
import {
  ListEventsByFilter,
  Input,
} from "~/src/domain/subscriptions/list-events";
import {
  SortOrder,
  ListEventFilters,
  SubscriptionEventName,
} from "~/src/domain/types/subscription";
import { mapError, response, StatusCodes } from "~/src/utils/response";
import { captureEventContext } from "~/src/interfaces/lambda-http/capture-context";
import { mapEvent } from "~/src/interfaces/lambda-http/subscriptions/get-events/handler";

export interface QueryParameters {
  from: string;
  to: string;
  count: number;
  sort: SortOrder;
  name: SubscriptionEventName[];
}

const DEFAULT_COUNT = 50;
const DEFAULT_SORT_ORDER = SortOrder.ASCENDING;

const queryParametersSchema: JSONSchemaType<QueryParameters> = {
  type: "object",
  properties: {
    from: { type: "string", format: "iso-date-time" },
    to: { type: "string", format: "iso-date-time" },
    count: { type: "number", minimum: 1 },
    sort: { type: "string", enum: [SortOrder.ASCENDING, SortOrder.DESCENDING] },
    name: {
      type: "array",
      items: {
        type: "string",
        enum: [
          SubscriptionEventName.SUBSCRIPTION_CREATED,
          SubscriptionEventName.SUBSCRIPTION_CANCELED,
          SubscriptionEventName.SUBSCRIPTION_ACTIVATED,
        ],
      },
    },
  },
  required: [],
};

const ajv = new Ajv();
addFormats(ajv);
const validateQueryParameters = ajv.compile(queryParametersSchema);

export interface Dependencies {
  listEventsByFilter: ListEventsByFilter;
}

export default function createHandler(
  deps: Dependencies
): APIGatewayProxyHandler {
  return async (event) => {
    const ctx = captureEventContext(event.headers);
    if (!ctx.actor) {
      return response(
        StatusCodes.BAD_REQUEST,
        {},
        "header x-finn-actor is required",
        ctx
      );
    }

    let count: number | undefined;
    if (event.queryStringParameters?.count) {
      count = Number(event.queryStringParameters?.count);
      if (Number.isNaN(count)) {
        return response(
          StatusCodes.BAD_REQUEST,
          {},
          "count must be a number",
          ctx
        );
      }
    }

    let name: SubscriptionEventName[] | undefined;
    if (event.queryStringParameters?.name) {
      name = event.queryStringParameters.name.split(
        ","
      ) as SubscriptionEventName[];
    }

    const qs = {
      count,
      from: event.queryStringParameters?.from,
      to: event.queryStringParameters?.to,
      sort: event.queryStringParameters?.sort,
      name,
    };

    if (!validateQueryParameters(qs)) {
      return response(
        StatusCodes.BAD_REQUEST,
        validateQueryParameters.errors,
        "invalid query parameters",
        ctx
      );
    }

    const filters: ListEventFilters = {
      name,
    };

    if (qs.from) {
      filters.from = new Date(qs.from);
    }

    if (qs.to) {
      const toDate = new Date(qs.to);
      if (filters.from && toDate < filters.from) {
        return response(
          StatusCodes.BAD_REQUEST,
          {},
          "'to' must be greater than or equal to 'from'",
          ctx
        );
      } else {
        filters.to = toDate;
      }
    }

    try {
      const input: Input = {
        filters,
        count: qs.count || DEFAULT_COUNT,
        sortOrder: qs.sort || DEFAULT_SORT_ORDER,
        metadata: ctx,
      };
      const events = await deps.listEventsByFilter(input);
      return response(StatusCodes.SUCCESS, mapEvent(events), "", ctx);
    } catch (err) {
      return mapError(err, ctx);
    }
  };
}
