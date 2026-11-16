const CJ_API_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const CJ_ACCESS_TOKEN = process.env.CJ_ACCESS_TOKEN;

type CjEnvelope<T> = { code?: number; result?: boolean; success?: boolean; message?: string; data?: T };

async function cjRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!CJ_ACCESS_TOKEN) throw new Error('CJ_ACCESS_TOKEN is not configured on the server.');
  const response = await fetch(`${CJ_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'CJ-Access-Token': CJ_ACCESS_TOKEN,
      ...init.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`CJ API request failed (${response.status}).`);
  const payload = await response.json() as CjEnvelope<T>;
  if (payload.code !== 200 || payload.result === false || payload.success === false || payload.data == null) {
    throw new Error(payload.message || 'CJ API returned an unsuccessful response.');
  }
  return payload.data;
}

type CjProduct = {
  pid: string;
  productNameEn?: string;
  productSku?: string;
  sellPrice?: number;
  variants?: Array<{
    vid: string;
    variantSku?: string;
    variantNameEn?: string;
    variantSellPrice?: number;
    inventories?: Array<{ countryCode?: string; totalInventory?: number; verifiedWarehouse?: number }>;
  }>;
};

export type CjQuote = {
  supplier: 'cjdropshipping';
  productId: string;
  variantId: string;
  variantSku: string | null;
  productTitle: string;
  supplierCostUsd: number;
  shippingOptions: Array<{
    carrier: string;
    shippingCostUsd: number;
    deliveryEstimate: string;
  }>;
  inventoryByOrigin: Array<{ countryCode: string; quantity: number; verified: boolean }>;
  quotedAt: string;
};

export async function getCjProductAndShippingQuote(input: {
  productId: string;
  variantId: string;
  originCountryCode: string;
  destinationCountryCode: string;
  quantity: number;
}): Promise<CjQuote> {
  const { productId, variantId, originCountryCode, destinationCountryCode, quantity } = input;
  if (!/^[\w-]{8,200}$/.test(productId) || !/^[\w-]{8,200}$/.test(variantId)) {
    throw new Error('A valid CJ product ID and variant ID are required.');
  }
  if (!/^[A-Z]{2}$/.test(originCountryCode) || !/^[A-Z]{2}$/.test(destinationCountryCode)) {
    throw new Error('Country codes must be two-letter ISO codes.');
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new Error('Quantity must be an integer between 1 and 20.');
  }

  const product = await cjRequest<CjProduct>(`/product/query?pid=${encodeURIComponent(productId)}`);
  if (product.pid !== productId) throw new Error('CJ product response did not match the requested product.');
  const variant = product.variants?.find(item => item.vid === variantId);
  if (!variant || typeof variant.variantSellPrice !== 'number' || !Number.isFinite(variant.variantSellPrice)) {
    throw new Error('CJ did not return a valid cost for the requested variant.');
  }

  const shipping = await cjRequest<Array<{
    logisticName?: string;
    logisticPrice?: number;
    logisticAging?: string;
    totalPostageFee?: number;
  }>>('/logistic/freightCalculate', {
    method: 'POST',
    body: JSON.stringify({
      startCountryCode: originCountryCode,
      endCountryCode: destinationCountryCode,
      products: [{ quantity, vid: variantId }],
    }),
  });

  const shippingOptions = shipping
    .filter(option => typeof option.logisticPrice === 'number' && Number.isFinite(option.logisticPrice) && option.logisticPrice >= 0)
    .map(option => ({
      carrier: option.logisticName || 'Unspecified carrier',
      shippingCostUsd: option.totalPostageFee ?? option.logisticPrice!,
      deliveryEstimate: option.logisticAging || 'Not provided',
    }));
  if (shippingOptions.length === 0) throw new Error('CJ returned no usable shipping options for this route.');

  const inventoryByOrigin = (variant.inventories ?? []).map(stock => ({
    countryCode: stock.countryCode || 'UNKNOWN',
    quantity: stock.totalInventory ?? 0,
    verified: stock.verifiedWarehouse === 1,
  }));

  return {
    supplier: 'cjdropshipping',
    productId,
    variantId,
    variantSku: variant.variantSku ?? null,
    productTitle: product.productNameEn || product.productSku || productId,
    supplierCostUsd: variant.variantSellPrice,
    shippingOptions,
    inventoryByOrigin,
    quotedAt: new Date().toISOString(),
  };
}
