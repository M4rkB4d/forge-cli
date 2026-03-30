const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Banking App',
  bffUrl: process.env.NEXT_PUBLIC_BFF_URL ?? '/api',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;

export default env;
