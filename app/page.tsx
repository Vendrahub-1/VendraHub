import Link from 'next/link';

const dashboardCards = [
  {
    title: 'Admin session',
    description: 'Operational overview, orders, inventory, store health, and permissions.',
    href: '/admin',
    accent: 'admin',
  },
  {
    title: 'Customer session',
    description: 'Browse products, track orders, wallet balances, and customer support.',
    href: '/customer',
    accent: 'customer',
  },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="eyebrow">VendraHub</div>
        <h1>Modern commerce sessions for admins and customers.</h1>
        <p>
          A complete starter foundation for the VendraHub storefront and control center, including a web app
          foundation, Android-capable packaging, and isolated admin/customer session flows.
        </p>
        <div className="hero-actions">
          <Link href="/admin" className="primary-button">Open admin</Link>
          <Link href="/customer" className="secondary-button">Open customer</Link>
        </div>
      </section>

      <section className="grid two-up">
        {dashboardCards.map((card) => (
          <Link key={card.title} href={card.href} className={`info-card ${card.accent}`}>
            <span className="card-kicker">Session</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <span className="card-link">Enter session →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
