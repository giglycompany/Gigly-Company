export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
];

export const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0]; // USD ($)

export function getCurrencyBySymbolOrCode(val?: string | null): CurrencyInfo {
  if (!val) return DEFAULT_CURRENCY;
  const trimmed = val.trim();
  const byCode = SUPPORTED_CURRENCIES.find(
    (c) => c.code.toLowerCase() === trimmed.toLowerCase()
  );
  if (byCode) return byCode;

  const bySymbol = SUPPORTED_CURRENCIES.find((c) => c.symbol === trimmed);
  if (bySymbol) return bySymbol;

  // Check if val contains one of the symbols
  for (const c of ['C$', 'A$']) {
    if (trimmed.includes(c)) {
      return SUPPORTED_CURRENCIES.find((item) => item.symbol === c) || DEFAULT_CURRENCY;
    }
  }
  for (const c of ['$', '€', '₹', '£', '¥']) {
    if (trimmed.includes(c)) {
      return SUPPORTED_CURRENCIES.find((item) => item.symbol === c) || DEFAULT_CURRENCY;
    }
  }

  return DEFAULT_CURRENCY;
}

/**
 * Replaces any existing currency symbol ($ | € | ₹ | £ | ¥ | C$ | A$) in a price or budget string
 * with the new target currency symbol.
 */
export function formatWithCurrency(priceStr: string | undefined | null, targetSymbolOrCode: string): string {
  if (!priceStr || !priceStr.trim()) return '';
  const target = getCurrencyBySymbolOrCode(targetSymbolOrCode).symbol;

  let str = priceStr.trim();
  let found = false;

  // Multi-char symbols first
  const multiChar = ['C$', 'A$'];
  for (const s of multiChar) {
    if (str.includes(s)) {
      found = true;
      str = str.split(s).join(target);
    }
  }

  // Single-char symbols
  const singleChar = ['$', '€', '₹', '£', '¥'];
  for (const s of singleChar) {
    if (str.includes(s)) {
      found = true;
      str = str.split(s).join(target);
    }
  }

  // If no currency symbol was found but string starts with a number or digit
  if (!found && /^\d/.test(str)) {
    return `${target}${str}`;
  }

  return str;
}

/**
 * Updates an input value (like "$55–75 / hr") when the user selects a new currency in the dropdown.
 */
export function updateInputWithCurrency(currentValue: string, newSymbol: string, fallbackRole?: 'freelancer' | 'business'): string {
  if (!currentValue || !currentValue.trim()) {
    if (fallbackRole === 'business') {
      return `${newSymbol}1,000–3,000 / project`;
    }
    return `${newSymbol}55–75 / hr`;
  }
  return formatWithCurrency(currentValue, newSymbol);
}
