export const CHANNEL_STATUSES = ["idea", "researching", "active", "converting", "dropped"] as const;

export const PARTNER_STAGES = [
  { key: "prospect", label: "Prospect" },
  { key: "contacted", label: "Contacted" },
  { key: "negotiating", label: "Negotiating" },
  { key: "signed", label: "Signed" },
  { key: "launched", label: "Launched" },
] as const;

export type PartnerStage = (typeof PARTNER_STAGES)[number]["key"];
