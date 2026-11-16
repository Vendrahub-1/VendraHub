export type PricingInput = {
  supplierCost: number;
  shippingCost: number;
  otherCosts?: number;
  paymentFeePercent?: number;
  platformFeePercent?: number;
  fixedFee?: number;
  targetMarginPercent?: number;
  minimumMarginPercent?: number;
  currency?: string;
};

export type PricingResult = {
  currency: string;
  landedCost: number;
  percentageFees: number;
  fixedFee: number;
  targetMarginPercent: number;
  minimumMarginPercent: number;
  recommendedPrice: number;
  estimatedNetProfit: number;
  estimatedMarginPercent: number;
  markupPercent: number;
  minimumPrice: number;
  meetsTarget: boolean;
  meetsMinimum: boolean;
};

const finiteNonNegative = (value: number | undefined, name: string): number => {
  const normalized = value ?? 0;
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error(`${name} must be a finite, non-negative number.`);
  }
  return normalized;
};

export function calculatePricing(input: PricingInput): PricingResult {
  const supplierCost = finiteNonNegative(input.supplierCost, 'Supplier cost');
  const shippingCost = finiteNonNegative(input.shippingCost, 'Shipping cost');
  const otherCosts = finiteNonNegative(input.otherCosts, 'Other costs');
  const fixedFee = finiteNonNegative(input.fixedFee, 'Fixed fee');
  const paymentFeePercent = finiteNonNegative(input.paymentFeePercent, 'Payment fee');
  const platformFeePercent = finiteNonNegative(input.platformFeePercent, 'Platform fee');
  const targetMarginPercent = finiteNonNegative(input.targetMarginPercent ?? 30, 'Target margin');
  const minimumMarginPercent = finiteNonNegative(input.minimumMarginPercent ?? 25, 'Minimum margin');

  const percentageFees = paymentFeePercent + platformFeePercent;
  if (percentageFees >= 100) throw new Error('Combined percentage fees must be below 100%.');
  if (targetMarginPercent >= 100 || minimumMarginPercent >= 100) {
    throw new Error('Profit margins must be below 100%.');
  }
  if (minimumMarginPercent > targetMarginPercent) {
    throw new Error('Minimum margin cannot exceed target margin.');
  }

  const landedCost = supplierCost + shippingCost + otherCosts;
  const targetDenominator = 1 - (percentageFees + targetMarginPercent) / 100;
  const minimumDenominator = 1 - (percentageFees + minimumMarginPercent) / 100;
  if (targetDenominator <= 0 || minimumDenominator <= 0) {
    throw new Error('Fees plus target margin leave no viable selling price.');
  }

  const recommendedPrice = (landedCost + fixedFee) / targetDenominator;
  const minimumPrice = (landedCost + fixedFee) / minimumDenominator;
  const estimatedNetProfit = recommendedPrice - landedCost - fixedFee - recommendedPrice * percentageFees / 100;
  const estimatedMarginPercent = recommendedPrice > 0 ? estimatedNetProfit / recommendedPrice * 100 : 0;
  const markupPercent = landedCost > 0 ? (recommendedPrice - landedCost) / landedCost * 100 : 0;

  return {
    currency: input.currency?.trim().toUpperCase() || 'NGN',
    landedCost: roundMoney(landedCost),
    percentageFees: roundMoney(percentageFees),
    fixedFee: roundMoney(fixedFee),
    targetMarginPercent: roundRate(targetMarginPercent),
    minimumMarginPercent: roundRate(minimumMarginPercent),
    recommendedPrice: roundMoney(recommendedPrice),
    estimatedNetProfit: roundMoney(estimatedNetProfit),
    estimatedMarginPercent: roundRate(estimatedMarginPercent),
    markupPercent: roundRate(markupPercent),
    minimumPrice: roundMoney(minimumPrice),
    meetsTarget: estimatedMarginPercent + 1e-9 >= targetMarginPercent,
    meetsMinimum: estimatedMarginPercent + 1e-9 >= minimumMarginPercent,
  };
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
