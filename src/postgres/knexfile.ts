import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  local: {
    client: "postgres",
    connection:
      process.env.SUBSCRIPTIONS_DATABASE_URL ||
      "postgres://postgres:password@localhost:5432/subscriptions_local_thesis",
    migrations: {
      tableName: "knex_migrations",
    },
  },
};

export default config;
