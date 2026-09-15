const CITIES_URL =
  'https://data.gov.il/api/3/action/datastore_search' +
  '?resource_id=d4901968-dad3-4845-a9b0-a57d027f11ab&limit=1500';


async function loadCities() {

  try {

    const res = await fetch(CITIES_URL);

    if (!res.ok) {
      throw new Error('Cities API failed');
    }

    const data = await res.json();

    return data.result.records
      .map(r => r['שם_ישוב'].trim())
      .filter(Boolean)
      .sort();

  } catch (err) {

    console.warn(
      'Cities API unavailable, using local fallback'
    );

    const res =
      await fetch('/js/cities.json');

    return res.json();
  }
}


async function populateCities(selectId = 'shippingCity') {

  const select =
    document.getElementById(selectId);

  if (!select) {
    return;
  }

  const cities = await loadCities();

  cities.forEach(city => {

    const option =
      document.createElement('option');

    option.value = city;
    option.textContent = city;

    select.appendChild(option);

  });
}


populateCities();               // עמוד התשלום
populateCities('regCity');      // הרשמה
populateCities('detCity');      // פרופיל