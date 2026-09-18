export type NomineeListItem = {
  id: string;
  name: string;
  initial: string;
  relationshipId: string;
  relationshipLabel: string;
  maskedAadhaar: string;
};

export type AddNomineeFormValues = {
  nomineeName: string;
  relationship: string;
  nomineeAadhaar: string;
};

export type AddNomineeFormErrors = Partial<
  Record<keyof AddNomineeFormValues, string>
>;
