import { Knex } from "knex";
import HealthIndicator from "~/src/domain/types/health-indicator";

export default class PostgresHealthIndicator implements HealthIndicator {
  private readonly client: Knex;

  constructor(client: Knex) {
    this.client = client;
  }

  async health(): Promise<number> {
    const start = Date.now();
    await this.client.raw("SELECT 1;");
    return Date.now() - start;
  }
}
