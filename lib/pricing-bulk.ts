import { calculatePricing, type PricingInput, type PricingResult } from '@/lib/pricing';

export type BulkPricingItem = {
  productId: string;
  title: string;
  supplier: string;
  input: PricingInput;
};

export type BulkPricingResult = {
  productId: string;
  title: string;
  supplier: string;
  pricing: PricingResult;
  recommendation: 'approve_for_review' | 'review_margin' | 'reject_for_review';
  explanation: string;
};

export function analyseBulkPricing(items: BulkPricingItem[]): BulkPricingResult[] {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    throw new Error('Submit between 1 and 100 products per analysis.');
  }
  const seen = new Set<string>();
  return items.map((item) => {
    if (!item.productId?.trim() || !item.title?.trim() || !item.supplier?.trim()) {
      throw new Error('Every product requires an ID, title and supplier.');
    }
    if (seen.has(item.productId)) throw new Error('Duplicate product IDs are not allowed.');
    seen.add(item.productId);

    const pricing = calculatePricing(item.input);
    const recommendation = !pricing.meetsMinimum
      ? 'reject_for_review'
      : pricing.meetsTarget
        ? 'approve_for_review'
        : 'review_margin';
    const explanation = recommendation === 'approve_for_review'
      ? 'The estimate meets the target margin. Owner approval is still required before changing a store price.'
      : recommendation === 'review_margin'
        ? 'The estimate clears the minimum margin but misses the target. Review costs and pricing before approval.'
        : 'The estimate is below the minimum margin. Do not publish this price without revising the economics.';
    return { productId: item.productId, title: item.title, supplier: item.supplier, pricing, recommendation, explanation };
  });
}
