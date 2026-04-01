/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEV_API_HOST?: string;
  readonly VITE_DEV_API_PORT?: string;
  readonly VITE_DEV_CLIENT_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
