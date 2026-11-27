import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/storefront/cart-provider';
import { WishlistProvider } from '@/components/storefront/wishlist-provider';

export const metadata: Metadata = {
  title: 'VendraHub',
  description: 'VendraHub — Shop Smart. Live Stylish. Fashion, footwear and lifestyle essentials.',
  applicationName: 'VendraHub',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/vendrahub-icon.svg', shortcut: '/vendrahub-icon.svg', apple: '/vendrahub-icon.svg' },
  openGraph: { title: 'VendraHub', description: 'Shop Smart. Live Stylish.', siteName: 'VendraHub', type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><WishlistProvider><CartProvider>{children}</CartProvider></WishlistProvider></body>
    </html>
  );
}
