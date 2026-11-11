import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VendraHub',
  description: 'VendraHub ecommerce, admin, and customer experience foundation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
