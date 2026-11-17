import Link from 'next/link';

const pathways = [
  {
    number: '01',
    label: 'FOR SHOPPERS',
    title: 'Find something you’ll love.',
    description:
      'Explore the VendraHub catalogue, see current product details, and sign in to your customer account.',
    href: '/customer',
    action: 'Explore the store',
    className: 'shopper',
  },
  {
    number: '02',
    label: 'FOR THE STORE TEAM',
    title: 'Your store, in one workspace.',
    description:
      'Open the admin workspace for store setup, supplier readiness, pricing tools, and operational planning.',
    href: '/admin',
    action: 'Open admin workspace',
    className: 'merchant',
  },
] as const;

export default function HomePage() {
  return (
    <main className="store-home">
      <header className="store-header">
        <Link href="/" className="store-brand" aria-label="VendraHub home">
          <span className="store-brand-mark">V</span>
          <span>Vendra<span>Hub</span></span>
        </Link>
        <nav className="store-nav" aria-label="Main navigation">
          <Link href="/customer">Shop</Link>
          <a href="#experience">Why VendraHub</a>
          <Link href="/customer/account">My account</Link>
        </nav>
        <Link href="/admin" className="store-header-admin">Admin workspace <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="store-hero" aria-labelledby="store-title">
        <div className="store-hero-copy">
          <p className="store-overline"><span /> A better way to shop online</p>
          <h1 id="store-title">Good finds.<br /><em>Thoughtfully</em> delivered.</h1>
          <p className="store-hero-description">
            Welcome to VendraHub — discover our collection and enjoy a simple,
            considered shopping experience.
          </p>
          <div className="store-hero-actions">
            <Link href="/customer" className="store-button store-button-gold">Explore the store <span aria-hidden="true">→</span></Link>
            <Link href="/customer/login" className="store-text-link">Sign in to your account <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="store-hero-note"><span aria-hidden="true">✳</span> Product details and pricing are provided by our Shopify storefront.</div>
        </div>
        <div className="store-hero-art" aria-label="VendraHub, more choice and better living">
          <div className="store-art-orbit store-art-orbit-one" />
          <div className="store-art-orbit store-art-orbit-two" />
          <div className="store-art-sun" />
          <div className="store-art-card">
            <span className="store-art-caption">THE VENDRAHUB EDIT</span>
            <span className="store-art-monogram">V<span>.</span></span>
            <span className="store-art-tagline">MORE CHOICE.<br />BETTER LIVING.</span>
          </div>
          <span className="store-art-side-note">DISCOVER · CHOOSE · ENJOY</span>
        </div>
      </section>

      <section className="store-assurance" aria-label="Store highlights">
        <div><span className="store-assurance-icon">01</span><p><strong>A curated experience</strong><br />Browse the live store catalogue</p></div>
        <div><span className="store-assurance-icon">02</span><p><strong>Your account, your way</strong><br />Manage your customer details</p></div>
        <div><span className="store-assurance-icon">03</span><p><strong>Here to help</strong><br />Reach customer support online</p></div>
      </section>

      <section className="store-pathways" id="experience" aria-labelledby="pathways-title">
        <div className="store-section-heading">
          <div><p className="store-section-kicker">WELCOME TO VENDRAHUB</p><h2 id="pathways-title">Everything you need,<br />right where you need it.</h2></div>
          <p>Whether you’re here to shop or run the store, start with the experience that’s right for you.</p>
        </div>
        <div className="store-pathway-grid">
          {pathways.map((pathway) => (
            <article className={`store-pathway-card ${pathway.className}`} key={pathway.number}>
              <div className="store-pathway-top"><span>{pathway.label}</span><span>{pathway.number}</span></div>
              <h3>{pathway.title}</h3>
              <p>{pathway.description}</p>
              <Link href={pathway.href} className="store-pathway-link">{pathway.action} <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="store-account-banner">
        <div><p className="store-section-kicker">YOUR VENDRAHUB ACCOUNT</p><h2>Shopping is better when it’s personal.</h2><p>Sign in to access your account, saved details, and support options.</p></div>
        <Link href="/customer/login" className="store-button store-button-dark">Go to my account <span aria-hidden="true">→</span></Link>
      </section>

      <footer className="store-footer">
        <Link href="/" className="store-brand"><span className="store-brand-mark">V</span><span>Vendra<span>Hub</span></span></Link>
        <p>More choice. Better living.</p>
        <div><Link href="/customer">Shop</Link><Link href="/customer/account">My account</Link><Link href="/admin">Admin</Link></div>
        <small>© {new Date().getFullYear()} VendraHub</small>
      </footer>
    </main>
  );
}
