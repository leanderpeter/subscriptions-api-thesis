import path from "path";
import { Knex } from "knex";
import Migrator from "~/src/domain/types/migrator";

export default class PostgresMigrator implements Migrator {
  private readonly client: Knex;

  constructor(client: Knex) {
    this.client = client;
  }

  async applyMigrations(): Promise<string> {
    await this.client.migrate.latest({
      directory: path.join(__dirname, "./migrations"),
    });
    return "success";
  }
}
