import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shopifyAdminGraphql } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

type OrdersResponse = {
  orders: { nodes: Array<{
    id: string; name: string; createdAt: string; displayFinancialStatus: string;
    displayFulfillmentStatus: string; totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
    lineItems: { nodes: Array<{ title: string; quantity: number; variant: { title: string } | null }> };
    fulfillments: Array<{ createdAt: string; displayStatus: string | null; trackingInfo: Array<{ company: string | null; number: string | null; url: string | null }> }>;
  }> };
};

const ORDERS_QUERY = `
  query VendraHubCustomerOrders($first: Int!, $query: String!) {
    orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id name createdAt displayFinancialStatus displayFulfillmentStatus
        totalPriceSet { shopMoney { amount currencyCode } }
        lineItems(first: 30) { nodes { title quantity variant { title } } }
        fulfillments {
          createdAt displayStatus
          trackingInfo { company number url }
        }
      }
    }
  }
`;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !user.email_confirmed_at) return json({ error: 'Sign in with a verified email address to view your orders.' }, 401);

  try {
    const email = user.email.trim().toLowerCase();
    const query = 'email:' + email.replace(/[\\s:"()]/g, '');
    const data = await shopifyAdminGraphql<OrdersResponse>(ORDERS_QUERY, { first: 30, query });
    const orders = data.orders.nodes.map(order => ({
      id: order.id, name: order.name, createdAt: order.createdAt,
      financialStatus: order.displayFinancialStatus, fulfillmentStatus: order.displayFulfillmentStatus,
      total: order.totalPriceSet.shopMoney,
      items: order.lineItems.nodes,
      fulfillments: order.fulfillments.map(fulfillment => ({
        createdAt: fulfillment.createdAt, status: fulfillment.displayStatus,
        tracking: fulfillment.trackingInfo.filter(info => info.url || info.number).map(info => ({
          company: info.company, number: info.number, url: info.url,
        })),
      })),
    }));
    return json({ orders, source: 'shopify' });
  } catch (error) {
    console.error('Customer order lookup failed:', error instanceof Error ? error.message : String(error));
    return json({ error: 'Order history is temporarily unavailable. Please try again later.' }, 503);
  }
}
