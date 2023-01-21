import { Knex } from "knex";
import { nanoid } from "nanoid";
import { ConflictError, NotFoundError } from "~/src/domain/types/errors";
import {
  CreateSubscriptionInputs,
  Money,
  Subscription,
  SubscriptionEvent,
  SubscriptionEventName,
  SubscriptionRepository,
  SubscriptionState,
  SubscriptionTermType,
  SubscriptionType,
  ListEventFilters,
  SortOrder,
  AddEventInputs,
  UpdateSubscriptionInputs,
  ListSubscriptionFilters,
} from "~/src/domain/types/subscription";

export type SubscriptionRecord = {
  id: string;
  state: SubscriptionState;
  contact_id: string;
  car_id: string;
  type: SubscriptionType;
  term: number;
  signing_date: Date;
  term_type: SubscriptionTermType;
  deposit: Money;
  amount: Money;
  mileage_package: number;
  mileage_package_fee: Money;
  additional_mileage_fee: Money;
  handover_firstname: string;
  handover_lastname: string;
  handover_housenumber: string;
  handover_street: string;
  handover_city: string;
  handover_zip: string;
  handover_address_extra: string | null;
  preferred_handover_date: Date;
  created_at: Date;
  updated_at: Date;
};

export type SubscriptionEventRecord = {
  id: string;
  name: string;
  actor: string;
  notes?: string;
  time: Date;
  snapshot: SubscriptionRecord;
  subscription_id: string;
};

const TABLES = {
  SUBSCRIPTIONS: "subscriptions",
  SUBSCRIPTION_EVENTS: "subscription_events",
};

export function mapNullableString(field: string | null): string | undefined {
  return field === null ? undefined : field;
}

export function mapNullableDate(field: Date | null): Date | undefined {
  return field ? new Date(field) : undefined;
}

export function mapNullableMoney(field: Money | null): Money | undefined {
  return field === null ? undefined : field;
}

export function mapToSubscription(sr: SubscriptionRecord): Subscription {
  return {
    id: sr.id,
    state: sr.state,
    contactId: sr.contact_id,
    carId: sr.car_id,
    type: sr.type,
    term: sr.term,
    signingDate: new Date(sr.signing_date),
    termType: sr.term_type,
    deposit: sr.deposit,
    amount: sr.amount,
    mileagePackage: sr.mileage_package,
    mileagePackageFee: sr.mileage_package_fee,
    additionalMileageFee: sr.additional_mileage_fee,
    handoverFirstName: sr.handover_firstname,
    handoverLastName: sr.handover_lastname,
    handoverHouseNumber: sr.handover_housenumber,
    handoverStreet: sr.handover_street,
    handoverCity: sr.handover_city,
    handoverZip: sr.handover_zip,
    handoverAddressExtra: mapNullableString(sr.handover_address_extra),
    preferredHandoverDate: new Date(sr.preferred_handover_date),
    createdAt: new Date(sr.created_at),
    updatedAt: new Date(sr.updated_at),
  };
}

export function mapToSubscriptionEvent(
  sre: SubscriptionEventRecord
): SubscriptionEvent {
  return {
    id: sre.id,
    name: sre.name as SubscriptionEventName,
    actor: sre.actor,
    notes: sre.notes,
    time: sre.time,
    snapshot: mapToSubscription(sre.snapshot),
    subscriptionId: sre.subscription_id,
  };
}

export function mapToSubscriptionRecord(
  sub: Partial<Subscription>
): Partial<SubscriptionRecord> {
  return {
    state: sub.state,
    contact_id: sub.contactId,
    car_id: sub.carId,
    type: sub.type,
    term: sub.term,
    term_type: sub.termType,
    deposit: sub.deposit,
    amount: sub.amount,
    mileage_package: sub.mileagePackage,
    mileage_package_fee: sub.mileagePackageFee,
    additional_mileage_fee: sub.additionalMileageFee,
    handover_firstname: sub.handoverFirstName,
    handover_lastname: sub.handoverLastName,
    handover_housenumber: sub.handoverHouseNumber,
    handover_street: sub.handoverStreet,
    handover_city: sub.handoverCity,
    handover_zip: sub.handoverZip,
    handover_address_extra: sub.handoverAddressExtra,
    preferred_handover_date: sub.preferredHandoverDate,
  };
}

interface PostgresError {
  readonly code: string | undefined;
  readonly detail: string | undefined;
  readonly message: string;
}

export class PGSubscriptionRepository implements SubscriptionRepository {
  private readonly connection;
  constructor(connection: Knex) {
    this.connection = connection;
  }

  async create({
    subscription,
    event,
  }: CreateSubscriptionInputs): Promise<Subscription> {
    const id = subscription.id || nanoid(10);
    try {
      const result = await this.connection.transaction(async (trx) => {
        const [subscriptionRecord] = await trx<SubscriptionRecord>(
          TABLES.SUBSCRIPTIONS
        )
          .insert({
            id,
            state: SubscriptionState.CREATED,
            contact_id: subscription.contactId,
            car_id: subscription.carId,
            type: subscription.type,
            term: subscription.term,
            signing_date: subscription.signingDate,
            term_type: subscription.termType,
            deposit: subscription.deposit,
            amount: subscription.amount,
            mileage_package: subscription.mileagePackage,
            mileage_package_fee: subscription.mileagePackageFee,
            additional_mileage_fee: subscription.additionalMileageFee,
            handover_firstname: subscription.handoverFirstName,
            handover_lastname: subscription.handoverLastName,
            handover_housenumber: subscription.handoverHouseNumber,
            handover_street: subscription.handoverStreet,
            handover_city: subscription.handoverCity,
            handover_zip: subscription.handoverZip,
            handover_address_extra: subscription.handoverAddressExtra,
            preferred_handover_date: subscription.preferredHandoverDate,
          })
          .returning("*");

        await trx<SubscriptionEventRecord>(TABLES.SUBSCRIPTION_EVENTS).insert({
          id: nanoid(),
          name: event.name,
          actor: event.actor,
          notes: event.notes,
          time: event.time,
          snapshot: subscriptionRecord,
          subscription_id: subscriptionRecord.id,
        });
        return subscriptionRecord;
      });

      return mapToSubscription(result);
    } catch (e) {
      const err = e as PostgresError;
      // Refer to https://www.postgresql.org/docs/12/errcodes-appendix.html for error codes
      if (err.code && err.code === "23505") {
        throw new ConflictError(`create Subscription<${id}>`);
      }
      throw err;
    }
  }

  async getById(id: string): Promise<Subscription> {
    const subscriptionRecord = await this.connection<SubscriptionRecord>(
      TABLES.SUBSCRIPTIONS
    )
      .select("*")
      .where({ id })
      .first();
    if (!subscriptionRecord) {
      throw new NotFoundError(`Subscription<${id}>`);
    }
    return mapToSubscription(subscriptionRecord);
  }

  async listEvents(
    filters: ListEventFilters,
    count: number,
    sortOrder: SortOrder = SortOrder.ASCENDING
  ): Promise<SubscriptionEvent[]> {
    const subscriptionEventRecords =
      await this.connection<SubscriptionEventRecord>(TABLES.SUBSCRIPTION_EVENTS)
        .select("*")
        .where((builder) => {
          if (filters.from) {
            builder = builder.where("time", ">=", filters.from);
          }
          if (filters.to) {
            builder = builder.where("time", "<=", filters.to);
          }
          if (filters.subscriptionId) {
            builder = builder.whereIn(
              "subscription_id",
              filters.subscriptionId
            );
          }
          if (filters.name) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            builder = builder.whereIn("name", filters.name);
          }
        })
        .orderBy("time", sortOrder)
        .limit(count);
    return subscriptionEventRecords.map(mapToSubscriptionEvent);
  }

  async addEvent(inputs: AddEventInputs): Promise<SubscriptionEvent> {
    const { id, event } = inputs;
    const result = await this.connection.transaction(async (trx) => {
      const subscriptionRecord = await trx<SubscriptionRecord>(
        TABLES.SUBSCRIPTIONS
      )
        .select("*")
        .where({ id })
        .first();

      if (!subscriptionRecord) {
        throw new NotFoundError(`Subscription<${id}>`);
      }

      const [eventRecord] = await trx<SubscriptionEventRecord>(
        TABLES.SUBSCRIPTION_EVENTS
      )
        .insert({
          id: nanoid(),
          name: event.name,
          actor: event.actor,
          notes: event.notes,
          time: event.time,
          snapshot: subscriptionRecord,
          subscription_id: subscriptionRecord.id,
        })
        .returning("*");
      return eventRecord;
    });

    return mapToSubscriptionEvent(result);
  }

  async update({
    id,
    subscription,
    event,
  }: UpdateSubscriptionInputs): Promise<Subscription> {
    const result = await this.connection.transaction(async (trx) => {
      const [subscriptionRecord] = await trx<SubscriptionRecord>(
        TABLES.SUBSCRIPTIONS
      )
        .update(mapToSubscriptionRecord(subscription))
        .where("id", id)
        .returning("*");

      await trx<SubscriptionEventRecord>(TABLES.SUBSCRIPTION_EVENTS).insert({
        id: nanoid(),
        name: event.name,
        actor: event.actor,
        notes: event.notes,
        time: event.time,
        snapshot: subscriptionRecord,
        subscription_id: subscriptionRecord.id,
      });
      return subscriptionRecord;
    });
    return mapToSubscription(result);
  }

  async list(
    filters: ListSubscriptionFilters = {},
    count = 50,
    offset = 0
  ): Promise<Subscription[]> {
    const subscriptions = await this.connection<SubscriptionRecord>(
      TABLES.SUBSCRIPTIONS
    )
      .select("*")
      .where((builder) => {
        if (filters.state) {
          builder = builder.whereIn("state", filters.state);
        }
        if (filters.carId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          builder = builder.whereIn("car_id", filters.carId);
        }
        if (filters.contactId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          builder = builder.whereIn("contact_id", filters.contactId);
        }
        if (filters.subscriptionId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          builder = builder.whereIn("id", filters.subscriptionId);
        }
        if (filters.type) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          builder = builder.whereIn("type", filters.type);
        }
      })
      .limit(count)
      .offset(offset);
    return subscriptions.map(mapToSubscription);
  }
}
