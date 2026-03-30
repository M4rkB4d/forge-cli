export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  ACCOUNTS: '/accounts',
  ACCOUNT_DETAIL: (id: string) => `/accounts/${id}`,
  TRANSFERS: '/transfers',
  NEW_TRANSFER: '/transfers/new',
  SETTINGS: '/settings',
} as const;
