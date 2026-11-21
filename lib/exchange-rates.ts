export type ExchangeRateSnapshot = {
  base: string;
  rates: Record<string, number>;
  provider: 'open.er-api.com';
  fetchedAt: string;
};

const SUPPORTED_CURRENCIES = new Set(['NGN', 'USD', 'GBP', 'EUR']);

export async function getExchangeRates(baseInput: string): Promise<ExchangeRateSnapshot> {
  const base = baseInput.trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.has(base)) throw new Error('Unsupported base currency.');

  const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Exchange-rate provider is temporarily unavailable.');

  const payload = await response.json() as {
    result?: string;
    time_last_update_utc?: string;
    rates?: Record<string, number>;
  };
  if (payload.result !== 'success' || !payload.rates) {
    throw new Error('Exchange-rate provider returned an invalid response.');
  }

  const rates: Record<string, number> = {};
  for (const currency of Array.from(SUPPORTED_CURRENCIES)) {
    const rate = payload.rates[currency];
    if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) rates[currency] = rate;
  }
  if (rates[base] !== 1) rates[base] = 1;
  if (Object.keys(rates).length < 2) throw new Error('Required currency rates are missing.');

  return {
    base,
    rates,
    provider: 'open.er-api.com',
    fetchedAt: payload.time_last_update_utc ?? new Date().toISOString(),
  };
}
