'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Product = {
 id: string; title: string; handle: string; descriptionHtml: string; vendor: string; productType: string;
 status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'; publishedAt: string | null; tags: string[];
 featuredImage: { url: string; altText: string | null } | null;
 variants: { nodes: Array<{ id: string; title: string; price: string; sku: string | null; inventoryQuantity: number | null; availableForSale: boolean }> };
};
type ProductForm = { title: string; description: string; vendor: string; productType: string; price: string; sku: string; imageUrl: string; tags: string };
const emptyForm: ProductForm = { title: '', description: '', vendor: 'VendraHub', productType: '', price: '', sku: '', imageUrl: '', tags: '' };
const statuses = ['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'] as const;

export default function ProductsManager() {
 const [products, setProducts] = useState<Product[]>([]);
 const [query, setQuery] = useState('');
 const [status, setStatus] = useState<(typeof statuses)[number]>('ALL');
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const [editing, setEditing] = useState<Product | null>(null);
 const [creating, setCreating] = useState(false);
 const [form, setForm] = useState<ProductForm>(emptyForm);

 const load = useCallback(async () => {
  setLoading(true); setError('');
  try {
   const params = new URLSearchParams({ status });
   if (query.trim()) params.set('q', query.trim());
   const response = await fetch('/api/admin/products?' + params.toString(), { cache: 'no-store' });
   const data = await response.json();
   if (!response.ok) throw new Error(data.error || 'Could not load products.');
   setProducts(data.products ?? []);
  } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load products.'); }
  finally { setLoading(false); }
 }, [query, status]);

 useEffect(() => { void load(); }, [load]);

 const openCreate = () => { setEditing(null); setForm(emptyForm); setCreating(true); setNotice(''); };
 const openEdit = (product: Product) => {
  const variant = product.variants.nodes[0];
  setEditing(product); setCreating(false);
  setForm({ title: product.title, description: product.descriptionHtml.replace(/<[^>]*>/g, ' '), vendor: product.vendor, productType: product.productType, price: variant?.price ?? '', sku: variant?.sku ?? '', imageUrl: product.featuredImage?.url ?? '', tags: product.tags.join(', ') });
  setNotice('');
 };
 const closeForm = () => { if (!saving) { setCreating(false); setEditing(null); } };
 const setField = (key: keyof ProductForm, value: string) => setForm(current => ({ ...current, [key]: value }));

 async function save(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); setSaving(true); setError(''); setNotice('');
  const payload = { title: form.title, description: form.description, vendor: form.vendor, productType: form.productType, price: form.price, sku: form.sku, imageUrl: form.imageUrl, tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean) };
  try {
   const response = await fetch(editing ? '/api/admin/products/' + encodeURIComponent(editing.id) : '/api/admin/products', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
   const data = await response.json();
   if (!response.ok && response.status !== 207) throw new Error(data.error || 'Could not save product.');
   setCreating(false); setEditing(null);
   setNotice(data.warning ? 'Product saved with a warning: ' + data.warning : data.message || 'Product saved.');
   await load();
  } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save product.'); }
  finally { setSaving(false); }
 }

 async function publication(product: Product, action: 'publish' | 'unpublish') {
  const confirmation = action === 'publish'
   ? window.confirm('Publish “' + product.title + '” to the Shopify Online Store now? Customers may be able to purchase it.')
   : window.confirm('Unpublish “' + product.title + '” from the Shopify Online Store?');
  if (!confirmation) return;
  setError(''); setNotice('');
  try {
   const response = await fetch('/api/admin/products/' + encodeURIComponent(product.id), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
   const data = await response.json();
   if (!response.ok) throw new Error(data.error || 'Publication change failed.');
   setNotice(data.message); await load();
  } catch (reason) { setError(reason instanceof Error ? reason.message : 'Publication change failed.'); }
 }

 const activeCount = useMemo(() => products.filter(product => product.publishedAt).length, [products]);
 return <section className="admin-products-manager">
  <div className="admin-metrics">
   <article className="metric-card"><span>Products shown</span><strong>{products.length}</strong><small>Current Shopify result page</small></article>
   <article className="metric-card"><span>Published in results</span><strong>{activeCount}</strong><small>Published timestamp supplied by Shopify</small></article>
   <article className="metric-card"><span>Drafts in results</span><strong>{products.filter(product => product.status === 'DRAFT').length}</strong><small>Not yet published</small></article>
   <article className="metric-card"><span>Product source</span><strong>Shopify</strong><small>Live Admin API</small></article>
  </div>
  <div className="admin-card admin-products-toolbar">
   <div className="admin-products-filters">
    <label>Search products<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by product title…" /></label>
    <label>Product status<select value={status} onChange={event => setStatus(event.target.value as (typeof statuses)[number])}>{statuses.map(value => <option key={value} value={value}>{value === 'ALL' ? 'All statuses' : value}</option>)}</select></label>
   </div>
   <button type="button" className="admin-products-primary" onClick={openCreate}>+ Add product</button>
  </div>
  {notice && <p className="admin-products-notice" role="status">{notice}</p>}
  {error && <p className="admin-products-error" role="alert">{error}</p>}
  {(creating || editing) && <form className="admin-card admin-product-form" onSubmit={save}>
   <div className="card-heading"><div><h3>{editing ? 'Edit product' : 'Add a product'}</h3><p>{editing ? 'Changes are saved to Shopify.' : 'New products are saved as drafts first.'}</p></div><button type="button" className="admin-products-secondary" onClick={closeForm} disabled={saving}>Close</button></div>
   <div className="admin-product-form-grid">
    <label>Product title *<input required minLength={2} maxLength={255} value={form.title} onChange={event => setField('title', event.target.value)} /></label>
    <label>Vendor / brand<input maxLength={255} value={form.vendor} onChange={event => setField('vendor', event.target.value)} /></label>
    <label>Category / product type<input maxLength={255} value={form.productType} onChange={event => setField('productType', event.target.value)} /></label>
    <label>Price *<input required type="number" min="0" step="0.01" value={form.price} onChange={event => setField('price', event.target.value)} /></label>
    <label>SKU<input maxLength={100} value={form.sku} onChange={event => setField('sku', event.target.value)} /></label>
    <label>Product image URL (HTTPS)<input type="url" value={form.imageUrl} onChange={event => setField('imageUrl', event.target.value)} placeholder="https://…" /></label>
    <label className="admin-product-description">Description<textarea rows={5} maxLength={10000} value={form.description} onChange={event => setField('description', event.target.value)} /></label>
    <label>Tags (comma separated)<input value={form.tags} onChange={event => setField('tags', event.target.value)} placeholder="new, featured, clothing" /></label>
   </div>
   <div className="admin-product-form-actions"><button type="submit" className="admin-products-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create draft product'}</button></div>
  </form>}
  <section className="admin-card admin-data-panel">
   <div className="card-heading"><div><h3>Shopify product catalogue</h3><p>Manage product details and Online Store publication.</p></div><span className="muted-tag">{products.length} PRODUCTS</span></div>
   {loading ? <div className="admin-empty">Loading Shopify products…</div> : products.length === 0 ? <div className="admin-empty"><strong>No products found</strong><p>{error ? 'Resolve the connection issue above and retry.' : 'Add your first product or change the filters.'}</p><button type="button" className="admin-products-secondary" onClick={() => void load()}>Refresh</button></div> : <div className="admin-table-wrap"><table className="admin-data-table"><thead><tr><th>Product</th><th>Price</th><th>SKU</th><th>Status</th><th>Inventory</th><th>Actions</th></tr></thead><tbody>{products.map(product => { const variant = product.variants.nodes[0]; return <tr key={product.id}><td><div className="admin-product-cell">{product.featuredImage?.url && <img src={product.featuredImage.url} alt={product.featuredImage.altText ?? ''} />}<div><strong>{product.title}</strong><small>{product.vendor || '—'} · {product.productType || 'Uncategorised'}</small></div></div></td><td>{variant?.price ?? '—'}</td><td>{variant?.sku || '—'}</td><td><span className={'admin-product-status status-' + product.status.toLowerCase()}>{product.publishedAt ? 'Published' : product.status}</span></td><td>{variant?.inventoryQuantity ?? 'Not tracked'}</td><td><div className="admin-product-actions"><button type="button" className="admin-products-secondary" onClick={() => openEdit(product)}>Edit</button>{product.publishedAt ? <button type="button" className="admin-products-secondary" onClick={() => void publication(product, 'unpublish')}>Unpublish</button> : <button type="button" className="admin-products-primary" onClick={() => void publication(product, 'publish')} disabled={product.status === 'ARCHIVED'}>Publish</button>}</div></td></tr>; })}</tbody></table></div>}
  </section>
  <p className="admin-products-footnote">New products are created as drafts. Publishing and unpublishing require confirmation. Product deletion is intentionally not offered here.</p>
 </section>;
}
