export const features = {
  maintenanceMode: process.env.FEATURE_MAINTENANCE_MODE === 'true',
} as const;
