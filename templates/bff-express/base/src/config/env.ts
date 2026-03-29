function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  port: optional('PORT', '3000'),
  nodeEnv: optional('NODE_ENV', 'development'),
};
