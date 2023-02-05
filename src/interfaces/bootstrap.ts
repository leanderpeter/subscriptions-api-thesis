import knex, { Knex } from "knex";
import axios from "axios";
import { getValueFromEnv } from "~/src/utils/system-utils";
import { PGSubscriptionRepository } from "~/src/postgres/subscriptions";
import HttpCustomerRepository from "~/src/adapters/customer";
import HttpCarRepository from "~/src/adapters/cars";

const DEFAULT_TIMEOUT = 5000;

export function getDBConnection(): Knex {
  const dbConnection = knex({
    client: "postgres",
    connection: getValueFromEnv("SUBSCRIPTIONS_DATABASE_URL"),
    // https://deniapps.com/blog/setup-aws-lambda-to-use-amazon-rds-proxy
    pool: {
      // delete all connections when idle
      min: 0,
      // Not more than 1 connection
      // Remember that each lambda container is sequential
      max: 1,
      createTimeoutMillis: 15000,
      acquireTimeoutMillis: 15000,
      // Free resources are destroyed
      idleTimeoutMillis: 1000,
      // Interval to check for idle resources.
      reapIntervalMillis: 500,
      createRetryIntervalMillis: 100,
    },
  });
  return dbConnection;
}

export function getSubscriptionRepository(
  dbConnection: Knex
): PGSubscriptionRepository {
  return new PGSubscriptionRepository(dbConnection);
}

export function getCustomerRepository(): HttpCustomerRepository {
  const httpCustomerConnection = axios.create({
    baseURL: getValueFromEnv("CUSTOMERS_SERVICE_BASE_URL"),
    timeout: DEFAULT_TIMEOUT,
  });
  return new HttpCustomerRepository(
    httpCustomerConnection,
    getValueFromEnv("CUSTOMERS_SERVICE_API_KEY")
  );
}

export function getCarRepository(): HttpCarRepository {
  const httpCarConnection = axios.create({
    baseURL: getValueFromEnv("CARS_SERVICE_BASE_URL"),
    timeout: DEFAULT_TIMEOUT,
  });
  return new HttpCarRepository(
    httpCarConnection,
    getValueFromEnv("CARS_SERVICE_API_KEY")
  );
}
