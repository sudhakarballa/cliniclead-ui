import { Deal } from "../models/deal";

export const calculateInactivityDays = (deal: Deal): number | null => {
  if (!deal) return null;

  const lastActivityDate = deal.modifiedDate || deal.updatedDate;
  const referenceDate = lastActivityDate || deal.createdDate;

  if (!referenceDate) return null;

  const now = new Date();
  const activityDate = new Date(referenceDate);
  const diffTime = Math.abs(now.getTime() - activityDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

export const formatInactivityBadge = (days: number): string => {
  if (days < 1) return "0d";
  return `${days}d`;
};
