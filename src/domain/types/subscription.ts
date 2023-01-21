export enum SubscriptionState {
  CREATED = "CREATED",
  ACTIVE = "ACTIVE",
  CANCELED = "CANCELED",
  STOPPED = "STOPPED",
  INACTIVE = "INACTIVE",
  ENDED = "ENDED",
}

export enum SubscriptionType {
  B2C = "B2C",
  B2B = "B2B",
  MINIB2B = "MINIB2B",
}

export enum SubscriptionTermType {
  FIXED = "FIXED",
  OPEN_ENDED = "OPEN_ENDED",
}

export type Money = number;

export type Subscription = {
  id: string;
  state: SubscriptionState;
  contactId: string;
  carId: string;
  type: SubscriptionType;
  term: number;
  signingDate: Date;
  termType: SubscriptionTermType;
  deposit: Money;
  amount: Money;
  mileagePackage: number;
  mileagePackageFee: Money;
  additionalMileageFee: Money;
  handoverFirstName: string;
  handoverLastName: string;
  handoverHouseNumber: string;
  handoverStreet: string;
  handoverCity: string;
  handoverZip: string;
  handoverAddressExtra?: string;
  preferredHandoverDate: Date;
  terminationReason?: string;
  terminationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export enum SubscriptionEventName {
  SUBSCRIPTION_CREATED = "subscription_created",
  SUBSCRIPTION_CANCELED = "subscription_canceled",
  SUBSCRIPTION_ACTIVATED = "subscription_activated",
  HOLDER_AGREEMENT_GENERATED = "holder_agreement_generated",
  SUBSCRIPTION_CONFIRMATION_GENERATED = "subscription_confirmation_generated",
  SUBSCRIPTION_STOPPED = "subscription_stopped",
  SUBSCRIPTION_DEACTIVATED = "subscription_deactivated",
  SUBSCRIPTION_ENDED = "subscription_ended",
}

export type SubscriptionEvent = {
  id: string;
  name: SubscriptionEventName;
  actor: string;
  notes?: string;
  time: Date;
  snapshot: Subscription;
  subscriptionId: string;
};

export type CreateSubscriptionInputs = {
  subscription: Pick<
    Subscription,
    | "contactId"
    | "carId"
    | "type"
    | "term"
    | "signingDate"
    | "termType"
    | "deposit"
    | "amount"
    | "mileagePackage"
    | "mileagePackageFee"
    | "additionalMileageFee"
    | "handoverFirstName"
    | "handoverLastName"
    | "handoverHouseNumber"
    | "handoverStreet"
    | "handoverCity"
    | "handoverZip"
    | "handoverAddressExtra"
    | "preferredHandoverDate"
  > & { id?: string };
  event: Omit<SubscriptionEvent, "snapshot" | "id" | "subscriptionId">;
};

export type ListSubscriptionFilters = {
  state?: SubscriptionState[];
  carId?: string[];
  contactId?: string[];
  subscriptionId?: string[];
  type?: SubscriptionType[];
};

export type ListEventFilters = {
  subscriptionId?: string[];
  name?: SubscriptionEventName[];
  from?: Date;
  to?: Date;
};

export enum SortOrder {
  ASCENDING = "asc",
  DESCENDING = "desc",
}

export type AddEventInputs = {
  id: string;
  event: Omit<SubscriptionEvent, "snapshot" | "id" | "subscriptionId">;
};

type UpdateableSubscriptionProperties = Pick<
  Subscription,
  "state" | "terminationReason" | "terminationDate"
>;

export type UpdateSubscriptionInputs = {
  id: string;
  subscription: Partial<UpdateableSubscriptionProperties>;
  event: Omit<SubscriptionEvent, "snapshot" | "id" | "subscriptionId">;
};

export interface SubscriptionRepository {
  create(inputs: CreateSubscriptionInputs): Promise<Subscription>;
  getById(id: string): Promise<Subscription>;
  listEvents(
    filters: ListEventFilters,
    count: number,
    sortOrder: SortOrder
  ): Promise<SubscriptionEvent[]>;
  addEvent(inputs: AddEventInputs): Promise<SubscriptionEvent>;
  update(inputs: UpdateSubscriptionInputs): Promise<Subscription>;
  list(
    filters: ListSubscriptionFilters,
    count: number,
    offset: number
  ): Promise<Subscription[]>;
}
