import Image from 'next/image';
import Link from 'next/link';
import CustomerBottomNav from '@/components/storefront/customer-bottom-nav';
import CustomerSidebar from '@/components/storefront/customer-sidebar';
import { searchShopifyProducts, ShopifyConfigurationError } from '@/lib/shopify';

export const dynamic = 'force-dynamic';
const categories = [
  { name: 'Clothing', query: 'clothing', note: 'Everyday essentials and statement pieces' },
  { name: 'Shoes', query: 'shoes', note: 'The right foundation for every look' },
  { name: 'Bags', query: 'bags', note: 'Carry your style everywhere' },
  { name: 'Accessories', query: 'accessories', note: 'Finishing touches that feel personal' },
  { name: 'Beauty', query: 'beauty', note: 'Everyday self-care and beauty finds' },
  { name: 'Lifestyle', query: 'home lifestyle', note: 'Thoughtful pieces for everyday living' },
];

export default async function CustomerCategoriesPage() {
  let products: Awaited<ReturnType<typeof searchShopifyProducts>> = [];
  let unavailable = false;
  try { products = await searchShopifyProducts('', 20); }
  catch (error) { if (!(error instanceof ShopifyConfigurationError)) unavailable = true; }
  return (
    <main className="vh-store">
      <header className="vh-store-header">
        <Link href="/customer" className="vh-store-brand"><Image src="/vendrahub-logo.svg" alt="VendraHub" width={220} height={64} priority /></Link>
        <CustomerSidebar />
      </header>
      <section className="vh-secondary-hero">
        <p className="vh-overline">FIND YOUR STYLE</p><h1>Explore the<br/><em>collections.</em></h1>
        <p>Start with a category or browse everything currently available in the VendraHub store.</p>
      </section>
      <section className="vh-category-grid" aria-label="Shop categories">
        {categories.map((category,index) => <Link key={category.name} href={`/customer?q=${encodeURIComponent(category.query)}#collection`} className="vh-category-tile">
          <span>0{index+1} / COLLECTION</span><strong>{category.name}</strong><small>{category.note}</small><b>Explore →</b>
        </Link>)}
      </section>
      <section className="vh-collection vh-category-live">
        <div className="vh-collection-heading"><div><p className="vh-overline">LIVE SHOPIFY CATALOGUE</p><h2>Available now</h2><p>Live product information from the VendraHub store.</p></div></div>
        {unavailable && <div className="vh-store-message">The live catalogue is temporarily unavailable. Please try again shortly.</div>}
        {!unavailable && products.length === 0 && <div className="vh-store-message">No active products are available right now.</div>}
        <div className="vh-product-grid">{products.map((product,index)=><article key={product.id} className="vh-product-card">
          <Link href={`/customer/products/${encodeURIComponent(product.handle)}`} className="vh-product-card-link">
            <div className="vh-product-media">{product.imageUrl?<img src={product.imageUrl} alt={product.imageAlt??product.title} loading={index<4?'eager':'lazy'}/>:<div className="vh-product-no-image">VH</div>}</div>
            <div className="vh-product-info"><h3>{product.title}</h3><strong>{new Intl.NumberFormat('en-NG',{style:'currency',currency:product.currencyCode,maximumFractionDigits:2}).format(Number(product.price))}</strong><span>View details →</span></div>
          </Link>
        </article>)}</div>
      </section>
      <CustomerBottomNav active="Categories" />
    </main>
  );
}
