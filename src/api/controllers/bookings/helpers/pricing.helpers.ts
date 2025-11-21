// src/api/controllers/bookings/helpers/pricing.helpers.ts
export const getDiscountForTier = (tier: string | null): number => {
  const discounts: Record<string, number> = {
    'Gold': 0.2,
    'Silver': 0.1,
    'Bronze': 0.05,
    'Worker': 0.5
  };
  return discounts[tier || ''] || 0;
};

export const calculateFinalPrice = (basePrice: number, loyaltyTier: string | null): number => {
  const discount = getDiscountForTier(loyaltyTier);
  return basePrice * (1 - discount);
};
