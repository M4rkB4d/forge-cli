const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Banking App',
  bffUrl: import.meta.env.VITE_BFF_URL ?? '/api',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

export default env;
