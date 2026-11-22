import Image from 'next/image';
import Link from 'next/link';

const pathways = [
  { eyebrow: 'CUSTOMER EXPERIENCE', title: 'Find your next favourite.', copy: 'Explore the live VendraHub collection, check availability and continue to secure Shopify checkout.', href: '/customer', action: 'Explore the store', className: 'home-pathway-shop' },
  { eyebrow: 'STORE OPERATIONS', title: 'Your store, in control.', copy: 'A protected workspace for catalogue operations, orders, customers, suppliers and store settings.', href: '/admin', action: 'Open admin workspace', className: 'home-pathway-admin' },
];

export default function HomePage() {
  return (
    <main className="vh-home">
      <header className="vh-home-header">
        <Link href="/" aria-label="VendraHub home"><Image src="/vendrahub-logo.svg" alt="VendraHub — Shop Smart. Live Stylish." width={260} height={76} priority /></Link>
        <nav aria-label="Main navigation">
          <Link href="/customer">Shop</Link>
          <Link href="/customer/account">My account</Link>
          <Link href="/admin" className="vh-admin-link">Admin sign in</Link>
        </nav>
      </header>

      <section className="vh-home-hero">
        <div className="vh-hero-copy">
          <p className="vh-overline">VENDRAHUB · STYLE FOR EVERY DAY</p>
          <h1>Good style.<br /><em>Good living.</em></h1>
          <p className="vh-hero-description">Discover pieces that bring confidence to your everyday. Shop the live collection with secure checkout powered by Shopify.</p>
          <div className="vh-hero-actions">
            <Link href="/customer" className="vh-button vh-button-dark">Shop the collection <span aria-hidden="true">↗</span></Link>
            <Link href="/customer/login" className="vh-text-link">Sign in to your account</Link>
          </div>
          <div className="vh-trust-row"><span>LIVE SHOPIFY CATALOGUE</span><span>SECURE HOSTED CHECKOUT</span><span>MADE FOR EVERYDAY STYLE</span></div>
        </div>
        <div className="vh-hero-art" aria-label="VendraHub brand artwork">
          <div className="vh-art-orbit vh-orbit-one" />
          <div className="vh-art-orbit vh-orbit-two" />
          <div className="vh-art-monogram">VH</div>
          <div className="vh-art-caption"><span>THE VENDRAHUB EDIT</span><strong>Wear what<br />moves you.</strong></div>
          <span className="vh-art-number">01 / STYLE</span>
        </div>
      </section>

      <section className="vh-pathways" aria-label="VendraHub destinations">
        {pathways.map((item, index) => (
          <Link href={item.href} className={`vh-pathway ${item.className}`} key={item.href}>
            <span className="vh-pathway-index">0{index + 1}</span>
            <span className="vh-overline">{item.eyebrow}</span>
            <h2>{item.title}</h2>
            <p>{item.copy}</p>
            <strong>{item.action} <span aria-hidden="true">→</span></strong>
          </Link>
        ))}
      </section>

      <footer className="vh-home-footer"><span>© {new Date().getFullYear()} VendraHub</span><span>Shop Smart. Live Stylish.</span><Link href="/customer">Continue shopping →</Link></footer>
    </main>
  );
}
