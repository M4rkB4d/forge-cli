const currencySymbols: Record<string, string> = {
  PHP: '₱', USD: '$', EUR: '€', GBP: '£', JPY: '¥',
};

export function formatCurrency(amount: number, currency: string): string {
  const symbol = currencySymbols[currency] ?? currency;
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
