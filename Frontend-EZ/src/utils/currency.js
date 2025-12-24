export const INR_RATE = 83 // static conversion rate: 1 USD = 83 INR

const PRICE_CURRENCY = import.meta.env.VITE_PRICE_CURRENCY || "INR"

export function toINR(usd){
  const n = Number(usd) || 0
  return n * INR_RATE
}

export function formatCurrency(value){
  const n = Number(value) || 0
  if (PRICE_CURRENCY === "USD") {
    // input is USD, convert to INR for display
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(toINR(n))
  }

  // assume value is already in INR
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)
}

// backward compat
export const formatINR = formatCurrency

export default formatCurrency
