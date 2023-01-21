import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable("subscriptions", (table) => {
      table.string("id", 50).notNullable().primary();
      table
        .enu("state", [
          "CREATED",
          "CANCELED",
          "ACTIVE",
          "INACTIVE",
          "ENDED",
          "STOPPED",
        ])
        .defaultTo("CREATED")
        .index();
      table.string("contact_id", 50).notNullable();
      table.string("car_id", 50).notNullable().index();
      table.enu("type", ["B2C", "B2B", "MINIB2B"]).notNullable();
      table.integer("term").notNullable();
      table.datetime("signing_date").notNullable();
      table.string("term_type", 50).notNullable();
      table.integer("deposit").notNullable();
      table.integer("amount").notNullable();
      table.integer("mileage_package").notNullable();
      table.integer("mileage_package_fee").notNullable();
      table.string("handover_firstname", 100).notNullable();
      table.string("handover_lastname", 100).notNullable();
      table.string("handover_housenumber", 100).notNullable();
      table.string("handover_street", 100).notNullable();
      table.string("handover_city", 100).notNullable();
      table.string("handover_zip", 100).notNullable();
      table.string("handover_address_extra", 100).nullable();
      table.integer("additional_mileage_fee", 100).nullable();
      table.datetime("preferred_handover_date").notNullable();
      table.string("termination_reason").nullable();
      table.datetime("termination_date").nullable();
      table.timestamps(true, true);
    })
    .createTable("subscription_events", (table) => {
      table.string("id", 50).notNullable().primary();
      table.string("name", 50).notNullable();
      table.string("actor", 200).notNullable();
      table.text("notes").nullable();
      table.datetime("time").notNullable();
      table.jsonb("snapshot").notNullable();
      table.string("subscription_id", 50).notNullable().index();
      table.foreign("subscription_id").references("subscriptions.id");
      // compound index on two fields
      table.index(["subscription_id", "time"]);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .dropTable("subscription_events")
    .dropTable("subscriptions");
}
