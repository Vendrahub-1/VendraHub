import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VendraHub | More choice. Better living.',
  description: 'Discover the VendraHub online store, manage your customer account, or open the store administration workspace.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
