import { AxiosError, AxiosInstance } from "axios";
import { Customer, CustomerRepository } from "~/src/domain/types/customer";
import HealthIndicator from "~/src/domain/types/health-indicator";
import {
  NotFoundError,
  ServiceUnavailableError,
} from "~/src/domain/types/errors";
import createLogger from "~/src/utils/logger";

type HealthResponse = {
  status: string;
  message: string;
};

type CustomerRecord = {
  id: string;
  properties: {
    address: string;
    city: string;
    date_of_birth: string;
    firstname: string;
    lastname: string;
    zip: string;
    internal_verification_decision_dl: string;
    internal_verification_decision_id: string;
  };
};

type GetCustomerResponse = {
  data: CustomerRecord;
};

export function mapToCustomer(input: CustomerRecord): Customer {
  return {
    id: input.id,
    firstName: input.properties.firstname,
    lastName: input.properties.lastname,
    dateOfBirth: new Date(input.properties.date_of_birth),
    street: input.properties.address,
    city: input.properties.city,
    zip: input.properties.zip,
    internalVerificationDecisionDl:
      input.properties.internal_verification_decision_dl,
    internalVerificationDecisionId:
      input.properties.internal_verification_decision_id,
  };
}

const l = createLogger("customers-adapter");
class HttpCustomerRepository implements CustomerRepository, HealthIndicator {
  private readonly cssConnection;

  constructor(cssConnection: AxiosInstance, cssApiKey: string) {
    this.cssConnection = cssConnection;
    this.cssConnection.defaults.headers.common["x-api-key"] = cssApiKey;
  }

  async health(): Promise<string> {
    const res = await this.cssConnection.get("/api/v2/health");
    return (res.data as HealthResponse).message;
  }

  async getById(
    id: string,
    metadata: { requestId: string; actor: string }
  ): Promise<Customer> {
    const url = `/api/internal/customers/${id}/profile`;
    try {
      const response = await this.cssConnection.get(url, {
        headers: {
          "x--request-id": metadata.requestId,
          "x-actor": metadata.actor,
        },
      });
      const record = (<GetCustomerResponse>response.data).data;
      return mapToCustomer(record);
    } catch (err) {
      const axiosErr = err as AxiosError;

      if (axiosErr.response) {
        const { status } = axiosErr.response;
        if (status === 404) {
          throw new NotFoundError(`Customer<${id}>`);
        } else {
          l.error("Cars-Service-Error", {
            actor: metadata.actor,
            requestId: metadata.requestId,
            err: (err as Error).message,
          });
          throw new ServiceUnavailableError("customers");
        }
      } else {
        throw err;
      }
    }
  }
}

export default HttpCustomerRepository;
