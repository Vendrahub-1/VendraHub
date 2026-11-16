import { calculatePricing, type PricingInput } from '@/lib/pricing';

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

export async function generatePricingRecommendation(input: {
  productTitle: string;
  category?: string;
  market: string;
  pricing: PricingInput;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) {
    throw new Error('AI pricing is not configured. Set GEMINI_API_KEY and GEMINI_MODEL on the server.');
  }
  if (!input.productTitle.trim() || input.productTitle.length > 180) {
    throw new Error('Product title must be between 1 and 180 characters.');
  }
  if (!input.market.trim() || input.market.length > 80) {
    throw new Error('A valid target market is required.');
  }

  const calculation = calculatePricing(input.pricing);
  const prompt = [
    'You are VendraHub pricing analyst.',
    'Provide a concise pricing recommendation based only on the supplied product, market, costs and calculated figures.',
    'Do not invent competitor prices, demand, supplier facts, tax rates or market research.',
    'Do not change the arithmetic or calculate a different price.',
    'Explain material risks and which missing costs should be verified.',
    'This is advisory only. Never claim that a product price has been changed or approved.',
    JSON.stringify({
      productTitle: input.productTitle,
      category: input.category ?? null,
      market: input.market,
      currency: calculation.currency,
      landedCost: calculation.landedCost,
      recommendedSellingPrice: calculation.recommendedPrice,
      estimatedNetProfit: calculation.estimatedNetProfit,
      estimatedNetMarginPercent: calculation.estimatedMarginPercent,
      targetMarginPercent: calculation.targetMarginPercent,
      minimumMarginPercent: calculation.minimumMarginPercent,
    }),
  ].join('\n');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 450 },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('AI pricing provider is unavailable.');
  const payload = await response.json() as GeminiResponse;
  const recommendation = payload.candidates?.[0]?.content?.parts
    ?.map(part => part.text ?? '')
    .join('\n')
    .trim();
  if (!recommendation) throw new Error('AI provider returned an empty recommendation.');

  return {
    calculation,
    recommendation,
    advisoryOnly: true as const,
    marketResearchVerified: false as const,
    priceChangeApplied: false as const,
  };
}
