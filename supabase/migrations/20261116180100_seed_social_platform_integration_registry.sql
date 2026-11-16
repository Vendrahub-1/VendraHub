create table if not exists public.social_platform_registry (
  platform_code text primary key,
  platform_name text not null,
  platform_category text not null check (platform_category in ('organic_social','messaging','website_publishing','paid_advertising','analytics')),
  connection_method text not null,
  publishing_capability text not null check (publishing_capability in ('supported','limited','unsupported','ads_only','analytics_only')),
  official_url text not null,
  integration_notes text not null default '',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.social_platform_registry enable row level security;
create policy social_platform_registry_admin_only on public.social_platform_registry for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
insert into public.social_platform_registry (platform_code,platform_name,platform_category,connection_method,publishing_capability,official_url,integration_notes) values
('facebook','Facebook','organic_social','Meta OAuth','supported','https://www.facebook.com/','Page publishing; select the authorised Page'),
('instagram','Instagram','organic_social','Meta / Instagram OAuth','supported','https://www.instagram.com/','Professional account and Meta permissions'),
('threads','Threads','organic_social','Meta OAuth','supported','https://www.threads.com/','Separate channel content and permissions'),
('tiktok','TikTok','organic_social','TikTok OAuth','supported','https://www.tiktok.com/','Video/photo publishing; privacy and commercial disclosures'),
('youtube','YouTube','organic_social','Google OAuth','supported','https://www.youtube.com/','Video publishing; channel authorisation'),
('linkedin','LinkedIn','organic_social','LinkedIn OAuth','supported','https://www.linkedin.com/','Choose personal profile or company Page'),
('x','X','organic_social','X OAuth','supported','https://x.com/','Text, image and video formats'),
('pinterest','Pinterest','organic_social','Pinterest OAuth','supported','https://www.pinterest.com/','Board selection required'),
('bluesky','Bluesky','organic_social','OAuth / app password','supported','https://bsky.app/','Credentials remain server-side'),
('telegram','Telegram','messaging','Bot token + channel admin consent','supported','https://telegram.org/','Bot added to selected channel/group'),
('whatsapp_business','WhatsApp Business','messaging','WhatsApp Business Platform / Meta verification','limited','https://business.whatsapp.com/','Opt-in customer messaging and approved templates; not a general feed publisher'),
('google_business','Google Business Profile','organic_social','Google OAuth','limited','https://www.google.com/business/','Local business updates'),
('wordpress','VendraHub website / WordPress','website_publishing','WordPress REST API or VendraHub CMS','supported','https://wordpress.com/','Website articles and landing pages'),
('discord','Discord','messaging','Bot OAuth / installation','limited','https://discord.com/','Selected authorised servers/channels'),
('google_ads','Google Ads','paid_advertising','Google Ads OAuth + developer token','ads_only','https://ads.google.com/','Paid campaigns only'),
('apple_ads','Apple Ads','paid_advertising','Apple Ads authorisation','ads_only','https://ads.apple.com/','Paid app-search advertising only'),
('snapchat_ads','Snapchat Ads','paid_advertising','Snap OAuth','ads_only','https://forbusiness.snapchat.com/','Paid campaigns only'),
('microsoft_ads','Microsoft Advertising','paid_advertising','Microsoft OAuth','ads_only','https://ads.microsoft.com/','Paid campaigns only'),
('google_analytics','Google Analytics','analytics','Google OAuth','analytics_only','https://analytics.google.com/','Measurement and reporting'),
('google_search_console','Google Search Console','analytics','Google OAuth','analytics_only','https://search.google.com/search-console/','Search performance reporting')
on conflict (platform_code) do update set platform_name=excluded.platform_name,platform_category=excluded.platform_category,connection_method=excluded.connection_method,publishing_capability=excluded.publishing_capability,official_url=excluded.official_url,integration_notes=excluded.integration_notes,enabled=true;
