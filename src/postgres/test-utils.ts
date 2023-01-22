import knex, { Knex } from "knex";
import path from "path";

export interface TestDBContext {
  knex: Knex;
  dbName: string;
  destroy(): Promise<void>;
}

export function connection(database = "postgres"): Knex {
  let conn = "";
  if (process.env.CI_TESTING === "true") {
    conn = `postgres://postgres:password@${
      process.env.POSTGRES_HOST || "localhost"
    }:${process.env.POSTGRES_PORT || "5432"}`;
  } else {
    process.env.SUBSCRIPTIONS_DATABASE_URL;
  }
  return knex({
    client: "postgres",
    connection: `${conn}/${database}`,
  });
}

export async function createDB(name: string): Promise<void> {
  const knex = connection();
  try {
    await knex.raw(`CREATE DATABASE ${name};`);
  } finally {
    await knex.destroy();
  }
}

export async function dropDB(name: string): Promise<void> {
  const knex = connection();
  try {
    await knex.raw(`DROP DATABASE ${name};`);
  } finally {
    await knex.destroy();
  }
}

export async function seed(name: string): Promise<Knex> {
  const knex = connection(name);
  try {
    await knex.migrate.latest({
      directory: path.join(__dirname, "migrations"),
    });
    return knex;
  } catch (err) {
    await knex.destroy();
    throw err;
  }
}

export default async function createTestDB(): Promise<TestDBContext> {
  const dbName = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  await createDB(dbName);
  const knex = await seed(dbName);
  return {
    knex,
    dbName,
    async destroy(): Promise<void> {
      await knex.destroy();
      await dropDB(dbName);
    },
  };
}
