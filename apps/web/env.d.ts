/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_POCKETBASE_URL?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_GA_ID?: string;
  readonly PUBLIC_UMAMI_SRC?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
  readonly PUBLIC_ENABLE_PASSWORD_LOGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
