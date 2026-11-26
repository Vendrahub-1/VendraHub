import Link from 'next/link';

const items = [
  { href: '/customer', label: 'Home', mark: '⌂' },
  { href: '/customer/categories', label: 'Categories', mark: '▦' },
  { href: '/customer/wishlist', label: 'Wishlist', mark: '♡' },
  { href: '/customer/orders', label: 'Orders', mark: '▤' },
  { href: '/customer/account', label: 'Account', mark: '○' },
] as const;

export default function CustomerBottomNav({ active = 'Home' }: { active?: string }) {
  return (
    <nav className="vh-bottom-nav" aria-label="Main customer navigation">
      {items.map(item => (
        <Link key={item.label} href={item.href} aria-current={active === item.label ? 'page' : undefined} className={active === item.label ? 'is-active' : undefined}>
          <span className="vh-bottom-nav-icon" aria-hidden="true">{item.mark}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
