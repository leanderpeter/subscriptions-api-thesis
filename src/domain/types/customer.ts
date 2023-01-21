export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  street: string;
  city: string;
  zip: string;
  internalVerificationDecisionDl: string;
  internalVerificationDecisionId: string;
};

export enum CustomerVerificationStates {
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface CustomerRepository {
  getById(
    id: string,
    metadata: {
      requestId: string;
      actor: string;
    }
  ): Promise<Customer>;
}
