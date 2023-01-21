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
  SubscriptionEvent,
} from "~/src/domain/types/subscription";
import { mapError, response, StatusCodes } from "~/src/utils/response";
import { captureEventContext } from "~/src/interfaces/lambda-http/capture-context";
import { mapSubscription } from "../get/handler";

export interface QueryParameters {
  from: string;
  to: string;
  count: number;
  sort: SortOrder;
}

export interface PathParameters {
  id: string;
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
  },
  required: [],
};

const pathParametersSchema: JSONSchemaType<PathParameters> = {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 },
  },
  required: ["id"],
};

const ajv = new Ajv();
addFormats(ajv);
const validateQueryParameters = ajv.compile(queryParametersSchema);
const validatePathParameters = ajv.compile(pathParametersSchema);

export interface Dependencies {
  listEventsByFilter: ListEventsByFilter;
}

export function mapEvent(
  events: SubscriptionEvent[]
): Record<string, unknown>[] {
  return events.map((event) => {
    return {
      id: event.id,
      name: event.name,
      actor: event.actor,
      notes: event.notes,
      time: event.time,
      snapshot: mapSubscription(event.snapshot),
      subscription_id: event.subscriptionId,
    };
  });
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
    if (!validatePathParameters(event.pathParameters)) {
      return response(
        StatusCodes.BAD_REQUEST,
        validatePathParameters.errors,
        "invalid path parameters",
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

    const qs = {
      count,
      from: event.queryStringParameters?.from,
      to: event.queryStringParameters?.to,
      sort: event.queryStringParameters?.sort,
    };

    if (!validateQueryParameters(qs)) {
      return response(
        StatusCodes.BAD_REQUEST,
        validateQueryParameters.errors,
        "invalid query parameters",
        ctx
      );
    }

    const { id } = event.pathParameters;
    const filters: ListEventFilters = {
      subscriptionId: [id],
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
