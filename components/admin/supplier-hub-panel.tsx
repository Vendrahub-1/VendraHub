'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type SupplierCode = 'syncee' | 'dsers' | 'cjdropshipping' | 'printful';
type SupplierStatus = { connection_status?: string; integration_method?: string; last_checked_at?: string | null };
type CatalogueProduct = {
  id: string; title: string; image?: string | null; sku?: string | null;
  cost?: string | number | null; currency?: string | null; category?: string | null;
  variant_count?: number | null; inventory?: number | null; free_shipping?: boolean; delivery_cycle_days?: string | number | null; status?: string | null;
};
type Supplier = {
  code: SupplierCode; name: string; method: string; detail: string;
  installUrl: string; docsUrl: string; directApi: boolean;
};

const suppliers: Supplier[] = [
  { code: 'syncee', name: 'Syncee AI Dropshipping', method: 'Shopify app', detail: 'Install and authorise Syncee in Shopify. Its supplier catalogue and import/sync workflow remain inside Syncee; VendraHub can inspect products after they reach Shopify.', installUrl: 'https://apps.shopify.com/syncee-1', docsUrl: 'https://help.syncee.com/en/articles/8886065-how-to-install-syncee-to-your-shopify-store', directApi: false },
  { code: 'dsers', name: 'DSers', method: 'Shopify app', detail: 'Install and authorise DSers in Shopify. DSers manages its own supplier catalogue and import workflow; VendraHub can inspect products after they reach Shopify.', installUrl: 'https://apps.shopify.com/dsers', docsUrl: 'https://help.dsers.com/link-shopify-store/', directApi: false },
  { code: 'cjdropshipping', name: 'CJdropshipping', method: 'Shopify app + direct API', detail: 'Use the Shopify app for store linking. The separately configured CJ API key enables VendraHub catalogue search after authentication succeeds.', installUrl: 'https://apps.shopify.com/cucheng', docsUrl: 'https://developers.cjdropshipping.com/en/api/api2/api/product.html', directApi: true },
  { code: 'printful', name: 'Printful', method: 'Shopify app + direct API', detail: 'Use the Shopify app for store linking. A valid server-side Printful API token enables VendraHub catalogue browsing.', installUrl: 'https://apps.shopify.com/printful', docsUrl: 'https://developers.printful.com/docs/', directApi: true },
];

export default function SupplierHubPanel({ initialStatuses }: { initialStatuses: Record<string, string> }) {
  const [statuses, setStatuses] = useState<Record<string, SupplierStatus>>(
    Object.fromEntries(Object.entries(initialStatuses).map(([key, value]) => [key, { connection_status: value }]))
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<'cjdropshipping' | 'printful' | 'shopify'>('cjdropshipping');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const callApi = useCallback(async (params: Record<string, string>) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Your owner session has expired. Sign in again.');
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!base || !key) throw new Error('Supabase browser configuration is missing.');
    const url = new URL('/functions/v1/supplier-hub', base);
    Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, value));
    const response = await fetch(url, {
      method: 'GET',
      headers: { apikey: key, Authorization: 'Bearer ' + session.access_token },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok !== true) throw new Error(payload?.message ?? payload?.error ?? 'Supplier service request failed.');
    return payload;
  }, []);

  const refreshStatuses = useCallback(async () => {
    try {
      const payload = await callApi({ action: 'status' });
      const next: Record<string, SupplierStatus> = {};
      for (const item of payload.suppliers ?? []) next[item.supplier_code] = item;
      setStatuses(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load supplier status.');
    }
  }, [callApi]);

  useEffect(() => { void refreshStatuses(); }, [refreshStatuses]);

  async function verifySupplier(code: SupplierCode) {
    setBusy(code); setError(''); setMessage('Checking supplier authentication and catalogue access…');
    try {
      const payload = await callApi({ action: 'connect', supplier: code });
      setMessage(code === 'cjdropshipping'
        ? 'CJdropshipping authentication succeeded. Catalogue access is available.'
        : 'Printful authentication succeeded. Catalogue access is available.');
      await refreshStatuses();
    } catch (e) {
      setMessage('');
      setError(e instanceof Error ? e.message : 'Supplier authentication failed.');
    } finally { setBusy(null); }
  }

  async function searchCatalogue() {
    setBusy('catalogue'); setError(''); setMessage('Searching the supplier catalogue…'); setProducts([]); setSearched(false);
    try {
      const payload = selected === 'shopify' ? await callApi({ action: 'shopify-catalogue', q: query }) : await callApi({ action: 'catalogue', supplier: selected, q: query, page: '1' });
      setProducts(Array.isArray(payload.products) ? payload.products : []);
      setSearched(true);
      setMessage(payload.products?.length ? 'Catalogue results loaded. These are supplier listings only; nothing has been imported.' : 'No matching catalogue products were returned.');
    } catch (e) {
      setMessage('');
      setError(e instanceof Error ? e.message : 'Catalogue search failed.');
    } finally { setBusy(null); }
  }

  return <div className="supplier-hub">
    <div className="supplier-hub-intro">
      <div><strong>Supplier connection centre</strong><p>Install the supplier app in Shopify, verify supported API credentials, then browse catalogue data. Credentials stay on the server.</p></div>
      <button type="button" className="supplier-refresh" onClick={() => void refreshStatuses()} disabled={busy !== null}>Refresh status</button>
    </div>
    <div className="supplier-grid">
      {suppliers.map((supplier) => {
        const status = statuses[supplier.code]?.connection_status ?? 'not_connected';
        return <article className="admin-card supplier-card" key={supplier.code}>
          <div className="supplier-title"><div><h3>{supplier.name}</h3><small>{supplier.method}</small></div><span className={status === 'connected' ? 'state state-success' : 'state'}>{status.replaceAll('_', ' ')}</span></div>
          <p>{supplier.detail}</p>
          <div className="supplier-links">
            <a href={supplier.installUrl} target="_blank" rel="noreferrer">Install on Shopify ↗</a>
            <a href={supplier.docsUrl} target="_blank" rel="noreferrer">API / setup guide ↗</a>
          </div>
          {supplier.directApi
            ? <button type="button" className="supplier-action" onClick={() => void verifySupplier(supplier.code)} disabled={busy !== null}>{busy === supplier.code ? 'Verifying…' : status === 'connected' ? 'Recheck authentication' : 'Verify API connection'}</button>
            : <p className="supplier-app-note">App authorisation is completed in Shopify. Direct VendraHub API catalogue search is not currently available for this supplier.</p>}
        </article>;
      })}
    </div>
    <div className="admin-card supplier-catalogue">
      <div className="card-heading"><div><h3>Supplier catalogue browser</h3><p>Search direct supplier catalogues or products already imported into Shopify. Syncee and DSers private catalogues remain inside their apps.</p></div><span className="muted-tag">READ ONLY</span></div>
      <div className="supplier-search">
        <label htmlFor="supplier-select">Supplier</label>
        <select id="supplier-select" value={selected} onChange={e => setSelected(e.target.value as 'cjdropshipping' | 'printful')}>
          <option value="cjdropshipping">CJdropshipping</option>
          <option value="printful">Printful</option>
          <option value="shopify">Shopify store products (including Syncee / DSers imports)</option>
        </select>
        <label htmlFor="supplier-query">Product keyword</label>
        <input id="supplier-query" value={query} onChange={e => setQuery(e.target.value)} maxLength={120} placeholder="e.g. hoodie, backpack, phone case" />
        <button type="button" className="supplier-action" onClick={() => void searchCatalogue()} disabled={busy !== null}>{busy === 'catalogue' ? 'Searching…' : 'Search catalogue'}</button>
      </div>
      {message && <p className="supplier-message" role="status">{message}</p>}
      {error && <p className="supplier-error" role="alert">{error}</p>}
      {searched && <div className="supplier-results">
        {products.map((product) => <article className="supplier-product" key={product.id}>
          {product.image ? <img src={product.image} alt="" loading="lazy" /> : <div className="supplier-product-placeholder">V</div>}
          <div className="supplier-product-info"><strong>{product.title}</strong><small>{product.category ?? 'Uncategorised'}{product.sku ? ' · SKU ' + product.sku : ''}</small>
            <small>{product.cost !== null && product.cost !== undefined ? 'Supplier cost: ' + product.cost + ' ' + (product.currency ?? '') : 'Supplier cost: not supplied in this catalogue response'}</small>
            {product.variant_count ? <small>{product.variant_count} variants</small> : null}
            {product.inventory !== null && product.inventory !== undefined ? <small>Verified stock reported: {product.inventory}</small> : null}\n            {product.free_shipping ? <small>Supplier marks this listing as free shipping</small> : null}\n            {product.delivery_cycle_days ? <small>Supplier delivery cycle: {product.delivery_cycle_days} days (estimate)</small> : null}\n            {product.status ? <small>Shopify status: {product.status}</small> : null}
          </div>
          <span className="state">Not imported</span>
        </article>)}
      </div>}
      <p className="supplier-guardrail">Catalogue browsing does not create Shopify products, change inventory, subscribe to paid plans, place supplier orders or charge customers.</p>
    </div>
  </div>;
}
