# VendraHub

VendraHub is an online store and commerce workspace starter. This repository now includes a basic Next.js app foundation with isolated admin and customer session experiences, plus Android packaging support for building an APK workflow.

## Included

- Next.js storefront shell for the VendraHub web app
- Admin session route with analytics and order overview
- Customer session route with storefront and wallet summary
- Capacitor configuration for Android app packaging
- Production-friendly project structure and starter docs

## Run locally

```bash
npm install
npm run dev
```

Then open:

- http://localhost:3000
- http://localhost:3000/admin
- http://localhost:3000/customer

## Android / APK workflow

This repository includes Capacitor configuration so the web app can be wrapped for Android builds.

```bash
npm install
npm run build
npm run app:sync
npm run app:open
```

The Android project can then be opened in Android Studio to generate an APK. This repo does not include a signed production APK because APK signing requires local Android SDK and keystore setup.

## Session model

- Admin session: operational dashboard, inventory, order monitoring
- Customer session: wallet summary, product browsing, support and order status

## Next steps

- connect the app to a real Shopify or ecommerce backend
- add Supabase or authentication providers for sign-in
- add product detail pages and admin CRUD workflows
- add role-based access controls and secure API routes
