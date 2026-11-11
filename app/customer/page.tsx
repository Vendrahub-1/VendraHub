import Link from 'next/link';

export default function CustomerPage() {
  const products = [
    { name: 'Aero Smart Watch', price: '₦89,000', stock: '12 left' },
    { name: 'Vendra Audio Max', price: '₦115,500', stock: '5 left' },
    { name: 'Desk Pro Lamp', price: '₦24,900', stock: '28 left' },
  ];

  return (
    <main className="session-page customer-theme">
      <div className="topbar">
        <Link href="/" className="crumb-link">← Back to home</Link>
        <span className="session-pill">Customer session</span>
      </div>

      <section className="panel intro-panel">
        <div>
          <p className="eyebrow">Signed in as customer</p>
          <h1>Welcome back, Blessing</h1>
        </div>
        <button className="secondary-button">View wallet</button>
      </section>

      <section className="stats-grid compact">
        <article className="stat-card">
          <span>Wallet</span>
          <strong className="positive">₦265,300</strong>
        </article>
        <article className="stat-card">
          <span>Orders</span>
          <strong className="neutral">3 active</strong>
        </article>
        <article className="stat-card">
          <span>Rewards</span>
          <strong className="positive">1,240 pts</strong>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <h2>Featured products</h2>
          <ul className="product-list">
            {products.map((product) => (
              <li key={product.name}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.stock}</span>
                </div>
                <span>{product.price}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Support</h2>
          <ul className="stack-list">
            <li>Delivery ETA: 2-3 days</li>
            <li>Return window: 14 days</li>
            <li>Live support: available</li>
            <li>Order updates: enabled</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
