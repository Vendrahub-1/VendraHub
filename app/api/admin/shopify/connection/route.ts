import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shopifyAdminGraphql } from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";

type ShopIdentity = {
  shop: {
    name: string;
    myshopifyDomain: string;
  };
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user ||
    user.email?.toLowerCase() !== "vendrahub@hotmail.com"
  ) {
    return NextResponse.json({ error: "Owner access only." }, { status: 403 });
  }

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assurance?.currentLevel !== "aal2") {
    return NextResponse.json(
      { error: "Authenticator verification required." },
      { status: 403 },
    );
  }

  try {
    const data = await shopifyAdminGraphql<ShopIdentity>(
      "query VendraHubShopConnection { shop { name myshopifyDomain } }",
    );

    return NextResponse.json(
      {
        connected: true,
        storeName: data.shop.name,
        storeDomain: data.shop.myshopifyDomain,
        apiVersion: process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-10",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Shopify Admin connection check failed:", error);
    return NextResponse.json(
      { connected: false, error: "Shopify Admin API connection failed." },
      { status: 502 },
    );
  }
}
