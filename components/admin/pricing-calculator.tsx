'use client';

import { useState } from 'react';

type Result = {
  currency: string;
  landedCost: number;
  recommendedPrice: number;
  minimumPrice: number;
  estimatedNetProfit: number;
  estimatedMarginPercent: number;
  markupPercent: number;
  meetsTarget: boolean;
  meetsMinimum: boolean;
};

const money = (value: number, currency: string) => new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency,
  maximumFractionDigits: 2,
}).format(value);

export default function PricingCalculator() {
  const [form, setForm] = useState({
    supplierCost: '10000',
    shippingCost: '2000',
    otherCosts: '0',
    paymentFeePercent: '2',
    platformFeePercent: '3',
    fixedFee: '0',
    targetMarginPercent: '30',
    minimumMarginPercent: '25',
    currency: 'NGN',
  });
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function calculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          ...Object.fromEntries(Object.entries(form).filter(([key]) => key !== 'currency').map(([key, value]) => [key, Number(value)])),
          currency: form.currency,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Pricing calculation failed.');
      setResult(payload.result as Result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Pricing calculation failed.');
    } finally {
      setBusy(false);
    }
  }

  const fields: Array<[keyof typeof form, string, string]> = [
    ['supplierCost', 'Supplier product cost', 'Product purchase cost before delivery'],
    ['shippingCost', 'Shipping and delivery', 'Supplier delivery cost to customer'],
    ['otherCosts', 'Other per-unit costs', 'Packaging, duties or additional costs, if applicable'],
    ['paymentFeePercent', 'Payment processing fee (%)', 'Percentage charged on selling price'],
    ['platformFeePercent', 'Platform / marketplace fee (%)', 'Percentage charged on selling price'],
    ['fixedFee', 'Fixed transaction fee', 'Fixed amount per order'],
    ['targetMarginPercent', 'Target net margin (%)', 'VendraHub default: 30%'],
    ['minimumMarginPercent', 'Minimum net margin (%)', 'VendraHub default: 25%'],
  ];

  return (
    <div className="admin-card">
      <div className="card-heading"><div><h3>Product pricing calculator</h3><p>Estimate a viable selling price from landed cost, fees and margin targets.</p></div><span className="muted-tag">CALCULATION ONLY</span></div>
      <form onSubmit={calculate} className="pricing-form">
        <div className="pricing-fields">
          {fields.map(([key, label, hint]) => <label className="pricing-field" key={key}><span>{label}</span><input type="number" min="0" step="0.01" required value={form[key]} onChange={event => update(key, event.target.value)} /><small>{hint}</small></label>)}
          <label className="pricing-field"><span>Currency</span><select value={form.currency} onChange={event => update('currency', event.target.value)}><option value="NGN">NGN — Nigerian naira</option><option value="USD">USD — US dollar</option><option value="GBP">GBP — British pound</option><option value="EUR">EUR — euro</option></select><small>All entered costs must use this same currency.</small></label>
        </div>
        <button type="submit" disabled={busy}>{busy ? 'Calculating…' : 'Calculate selling price'}</button>
      </form>
      {error && <p className="pricing-error" role="alert">{error}</p>}
      {result && <div className="pricing-results" aria-live="polite">
        <div className="pricing-result-main"><span>Recommended selling price</span><strong>{money(result.recommendedPrice, result.currency)}</strong><small>Calculated to target the configured net margin</small></div>
        <div className="pricing-result-grid">
          <div><span>Landed cost</span><strong>{money(result.landedCost, result.currency)}</strong></div>
          <div><span>Estimated net profit</span><strong>{money(result.estimatedNetProfit, result.currency)}</strong></div>
          <div><span>Estimated net margin</span><strong>{result.estimatedMarginPercent.toFixed(2)}%</strong></div>
          <div><span>Markup on landed cost</span><strong>{result.markupPercent.toFixed(2)}%</strong></div>
          <div><span>Minimum price at floor margin</span><strong>{money(result.minimumPrice, result.currency)}</strong></div>
          <div><span>Margin check</span><strong>{result.meetsMinimum ? 'Meets minimum' : 'Below minimum'}{result.meetsTarget ? ' · Target met' : ''}</strong></div>
        </div>
        <p className="admin-footnote">Estimate only. Confirm actual supplier delivery, duties, payment fees, exchange rates and refunds before setting a live Shopify price. This calculator does not import, update or publish products.</p>
      </div>}
    </div>
  );
}
