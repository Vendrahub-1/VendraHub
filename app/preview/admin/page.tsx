import AdminPage from '../../admin/page';

export const metadata = {
  title: 'VendraHub Admin Preview',
  description: 'Read-only front-end preview of the VendraHub administration workspace.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPreviewPage() {
  return <AdminPage />;
}
