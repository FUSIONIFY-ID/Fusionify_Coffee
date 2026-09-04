export type ConfigureLoyaltyProgramInput = {
  spendUnit: number;
  pointsPerUnit: number;
  active: boolean;
};

export type MembershipTierTranslations = {
  ID_ID?: string;
  MS_MY?: string;
  EN?: string;
};

export type ConfigureMembershipTierInput = {
  name: string;
  translations?: MembershipTierTranslations;
  minimumQualifyingSpend: number;
  pointsMultiplierBps: number;
  active: boolean;
};
