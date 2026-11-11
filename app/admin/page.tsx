import Link from 'next/link';

export default function AdminPage() {
  const stats = [
    { label: 'Revenue', value: '₦5.8M', tone: 'positive' },
    { label: 'Orders', value: '1,482', tone: 'neutral' },
    { label: 'Inventory health', value: '94%', tone: 'positive' },
    { label: 'Open tickets', value: '23', tone: 'warning' },
  ];

  const recentOrders = [
    { id: '#VHD-2401', customer: 'Ada Okafor', status: 'Paid', total: '₦89,400' },
    { id: '#VHD-2402', customer: 'Kelechi Nwosu', status: 'Packed', total: '₦52,100' },
    { id: '#VHD-2403', customer: 'Sarah Bello', status: 'Shipped', total: '₦167,000' },
  ];

  return (
    <main className="session-page admin-theme">
      <div className="topbar">
        <Link href="/" className="crumb-link">← Back to home</Link>
        <span className="session-pill">Admin session</span>
      </div>

      <section className="panel intro-panel">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1>VendraHub control center</h1>
        </div>
        <button className="primary-button">Sync storefront</button>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <span>{stat.label}</span>
            <strong className={stat.tone}>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <h2>Recent orders</h2>
          <ul className="table-list">
            {recentOrders.map((item) => (
              <li key={item.id}>
                <span>{item.id}</span>
                <span>{item.customer}</span>
                <span>{item.status}</span>
                <strong>{item.total}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Operational checks</h2>
          <ul className="stack-list">
            <li>Inventory sync: healthy</li>
            <li>Payment gateway: online</li>
            <li>Return requests: 4 pending</li>
            <li>Marketing campaign: scheduled</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
