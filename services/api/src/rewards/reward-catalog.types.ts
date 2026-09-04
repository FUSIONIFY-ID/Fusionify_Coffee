export type RewardCatalogTranslations = {
  ID_ID?: { title?: string; description?: string };
  MS_MY?: { title?: string; description?: string };
  EN?: { title?: string; description?: string };
};

export type ConfigureRewardCatalogItemInput = {
  title: string;
  description?: string;
  translations?: RewardCatalogTranslations;
  currency: string;
  pointsCost: number;
  voucherId: string;
  active: boolean;
  stockLimit?: number | null;
};
