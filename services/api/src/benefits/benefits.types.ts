export type ConfigureWifiBenefitInput = {
  ssid: string;
  password: string;
  entitlementHours: number;
  active: boolean;
};

export type ConfigureAiBenefitInput = {
  dailyQuota: number;
  entitlementHours: number;
  active: boolean;
};
