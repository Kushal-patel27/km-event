export const INR_RATE = 83 // static conversion rate: 1 USD = 83 INR

export function toINR(usd){
  const n = Number(usd) || 0
  return n * INR_RATE
}

export function formatINR(usd){
  const inr = toINR(usd)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inr)
}

export default formatINR
