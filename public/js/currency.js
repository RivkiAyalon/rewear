let rate = null;

async function getUsdRate() {
  if (rate) return rate;

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/ILS');
    const data = await res.json();
    rate = data.rates.USD;
  } catch {
    rate = 0.27;
  }

  return rate;
}

async function priceInUsd(ils) {
  const r = await getUsdRate();
  return Math.round(ils * r);
}