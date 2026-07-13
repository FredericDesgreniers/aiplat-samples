import { defineTool } from '@ai-platform/plugin-sdk'

type Area = { name: string; lat: number; lon: number }
type City = { name: string; country: string; lat: number; lon: number; tier: 1 | 2; areas: Area[] }

const CITIES: City[] = [
  { name: 'New York', country: 'United States', lat: 40.758, lon: -73.9855, tier: 1, areas: [['Midtown', .012, .003], ['SoHo', -.034, -.012], ['Chelsea', -.014, -.014], ['Upper West Side', .027, -.016], ['Williamsburg', -.018, .045]].map(([name, lat, lon]) => ({ name: String(name), lat: 40.758 + Number(lat), lon: -73.9855 + Number(lon) })) },
  { name: 'San Francisco', country: 'United States', lat: 37.7749, lon: -122.4194, tier: 1, areas: [['Union Square', .013, .012], ['Nob Hill', .018, .006], ['SoMa', -.010, .014], ['Marina', .029, -.018], ['Mission', -.015, -.010]].map(([name, lat, lon]) => ({ name: String(name), lat: 37.7749 + Number(lat), lon: -122.4194 + Number(lon) })) },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lon: -118.2437, tier: 1, areas: [['Downtown', 0, 0], ['Hollywood', .049, -.085], ['Beverly Grove', .020, -.118], ['Koreatown', .010, -.065], ['Santa Monica', -.033, -.248]].map(([name, lat, lon]) => ({ name: String(name), lat: 34.0522 + Number(lat), lon: -118.2437 + Number(lon) })) },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lon: -87.6298, tier: 2, areas: [['The Loop', .004, .002], ['River North', .015, .002], ['West Loop', .006, -.027], ['Lincoln Park', .044, -.020], ['Gold Coast', .030, .003]].map(([name, lat, lon]) => ({ name: String(name), lat: 41.8781 + Number(lat), lon: -87.6298 + Number(lon) })) },
  { name: 'Miami', country: 'United States', lat: 25.7617, lon: -80.1918, tier: 1, areas: [['Downtown', 0, 0], ['Brickell', -.010, -.002], ['South Beach', .021, .062], ['Wynwood', .039, -.008], ['Coconut Grove', -.033, -.048]].map(([name, lat, lon]) => ({ name: String(name), lat: 25.7617 + Number(lat), lon: -80.1918 + Number(lon) })) },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832, tier: 1, areas: [['Downtown', 0, 0], ['Yorkville', .018, .007], ['Queen West', -.002, -.022], ['Harbourfront', -.015, .001], ['The Annex', .019, -.023]].map(([name, lat, lon]) => ({ name: String(name), lat: 43.6532 + Number(lat), lon: -79.3832 + Number(lon) })) },
  { name: 'Montreal', country: 'Canada', lat: 45.5017, lon: -73.5673, tier: 2, areas: [['Old Montreal', -.004, .012], ['Downtown', 0, 0], ['Plateau', .023, -.014], ['Mile End', .035, -.025], ['Griffintown', -.015, -.015]].map(([name, lat, lon]) => ({ name: String(name), lat: 45.5017 + Number(lat), lon: -73.5673 + Number(lon) })) },
  { name: 'Vancouver', country: 'Canada', lat: 49.2827, lon: -123.1207, tier: 1, areas: [['Downtown', 0, 0], ['Gastown', .001, .016], ['Yaletown', -.009, .003], ['West End', .004, -.025], ['Kitsilano', -.016, -.045]].map(([name, lat, lon]) => ({ name: String(name), lat: 49.2827 + Number(lat), lon: -123.1207 + Number(lon) })) },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -.1278, tier: 1, areas: [['Westminster', -.008, .003], ['Soho', .007, -.007], ['Covent Garden', .006, .004], ['South Bank', -.006, .014], ['Shoreditch', .017, .058]].map(([name, lat, lon]) => ({ name: String(name), lat: 51.5074 + Number(lat), lon: -.1278 + Number(lon) })) },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, tier: 1, areas: [['Le Marais', .003, .015], ['Saint-Germain', -.006, -.017], ['Montmartre', .031, -.009], ['Latin Quarter', -.007, .009], ['Opéra', .015, -.018]].map(([name, lat, lon]) => ({ name: String(name), lat: 48.8566 + Number(lat), lon: 2.3522 + Number(lon) })) },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041, tier: 1, areas: [['Centrum', 0, 0], ['Jordaan', .005, -.020], ['De Pijp', -.018, .010], ['Museum Quarter', -.020, -.022], ['Oost', -.004, .036]].map(([name, lat, lon]) => ({ name: String(name), lat: 52.3676 + Number(lat), lon: 4.9041 + Number(lon) })) },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393, tier: 2, areas: [['Baixa', -.010, .002], ['Chiado', -.009, -.009], ['Alfama', -.008, .018], ['Bairro Alto', -.006, -.014], ['Príncipe Real', .002, -.019]].map(([name, lat, lon]) => ({ name: String(name), lat: 38.7223 + Number(lat), lon: -9.1393 + Number(lon) })) },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038, tier: 2, areas: [['Centro', 0, 0], ['Malasaña', .010, -.005], ['Chueca', .009, .006], ['Retiro', -.003, .028], ['La Latina', -.009, -.009]].map(([name, lat, lon]) => ({ name: String(name), lat: 40.4168 + Number(lat), lon: -3.7038 + Number(lon) })) },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964, tier: 2, areas: [['Centro Storico', -.003, -.016], ['Trastevere', -.014, -.026], ['Monti', -.008, .010], ['Prati', .007, -.038], ['Testaccio', -.029, -.016]].map(([name, lat, lon]) => ({ name: String(name), lat: 41.9028 + Number(lat), lon: 12.4964 + Number(lon) })) },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417, tier: 1, areas: [['Old Town', .002, .006], ['Enge', -.014, -.010], ['Seefeld', -.006, .024], ['Aussersihl', -.001, -.024], ['Wiedikon', -.019, -.022]].map(([name, lat, lon]) => ({ name: String(name), lat: 47.3769 + Number(lat), lon: 8.5417 + Number(lon) })) },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, tier: 1, areas: [['Shinjuku', .014, .051], ['Shibuya', -.018, .051], ['Ginza', .004, .113], ['Asakusa', .038, .147], ['Roppongi', -.014, .081]].map(([name, lat, lon]) => ({ name: String(name), lat: 35.6762 + Number(lat), lon: 139.6503 + Number(lon) })) },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.978, tier: 2, areas: [['Myeongdong', -.003, .007], ['Insadong', .007, .008], ['Hongdae', -.010, -.054], ['Gangnam', -.069, .049], ['Itaewon', -.032, .014]].map(([name, lat, lon]) => ({ name: String(name), lat: 37.5665 + Number(lat), lon: 126.978 + Number(lon) })) },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, tier: 1, areas: [['Marina Bay', -.069, .040], ['Orchard', -.048, .012], ['Chinatown', -.068, .023], ['Bugis', -.052, .035], ['Clarke Quay', -.063, .020]].map(([name, lat, lon]) => ({ name: String(name), lat: 1.3521 + Number(lat), lon: 103.8198 + Number(lon) })) },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, tier: 1, areas: [['CBD', 0, 0], ['The Rocks', .010, -.001], ['Darling Harbour', -.004, -.012], ['Surry Hills', -.014, .004], ['Potts Point', -.001, .018]].map(([name, lat, lon]) => ({ name: String(name), lat: -33.8688 + Number(lat), lon: 151.2093 + Number(lon) })) },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, tier: 1, areas: [['Downtown', -.007, .004], ['Dubai Marina', -.124, -.130], ['Deira', .065, .040], ['Jumeirah', -.007, -.070], ['Business Bay', -.020, .000]].map(([name, lat, lon]) => ({ name: String(name), lat: 25.2048 + Number(lat), lon: 55.2708 + Number(lon) })) },
]

const NOUNS = ['Meridian', 'Solstice', 'Harbor', 'Willow', 'Cobalt', 'Juniper', 'Atlas', 'Linden', 'Aurora', 'Crescent']
const SUFFIXES = ['Grand', 'Palace', 'House', 'Retreat', 'Residence', 'Suites']
const AMENITIES = ['wifi', 'breakfast', 'pool', 'gym', 'spa', 'parking', 'bar', 'restaurant', 'laundry', 'airport-shuttle']

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function weekend(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day === 0 || day === 6
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default defineTool({
  name: 'search-hotels',
  description: 'Search deterministic sample hotel inventory by city, stay dates, and guest count, including neighborhoods, coordinates, ratings, amenities, and nightly USD prices.',
  inputSchema: {
    type: 'object',
    properties: {
      city: { type: 'string' },
      checkIn: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      checkOut: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      guests: { type: 'number', minimum: 1, maximum: 6, default: 2 },
    },
    required: ['city'],
    additionalProperties: false,
  },
  async execute(_ctx, input) {
    const query = String(input.city || '').trim().toLowerCase()
    const city = CITIES.find((c) => c.name.toLowerCase() === query) || CITIES.find((c) => c.name.toLowerCase().includes(query) && query.length > 0)
    if (!city) return { error: `Unknown city: ${input.city}`, knownCities: CITIES.map((c) => c.name) }
    const checkIn = input.checkIn || ''
    const checkOut = input.checkOut || ''
    const guests = input.guests || 2
    const random = mulberry32(hash(JSON.stringify({ city: city.name, checkIn, checkOut, guests })))
    const hotels = []
    const usedNames = new Set<string>()
    let inventoryIndex = 0

    for (const area of city.areas) {
      const areaMix = hash(`${city.name}|${area.name}`) % 3
      const starMix = city.tier === 1
        ? areaMix === 0 ? [2, 3, 3, 4, 4] : areaMix === 1 ? [3, 3, 4, 4, 5] : [2, 3, 4, 4, 5, 5]
        : areaMix === 0 ? [2, 3, 3, 4] : areaMix === 1 ? [2, 3, 4, 4] : [2, 3, 3, 4, 5]
      for (const stars of starMix) {
      const i = inventoryIndex++
      let name = stars === 5
        ? `The ${NOUNS[Math.floor(random() * NOUNS.length)]} ${SUFFIXES[Math.floor(random() * SUFFIXES.length)]}`
        : stars === 4
          ? `${NOUNS[Math.floor(random() * NOUNS.length)]} ${SUFFIXES[Math.floor(random() * SUFFIXES.length)]}`
          : stars === 3 ? `${area.name} Inn` : `${area.name} Lodge`
      if (usedNames.has(name)) name = `${name} ${NOUNS[(i + Math.floor(random() * NOUNS.length)) % NOUNS.length]}`
      usedNames.add(name)
      const lat = area.lat + (random() * .016 - .008)
      const lon = area.lon + (random() * .016 - .008)
      const latKm = (lat - city.lat) * 111
      const lonKm = (lon - city.lon) * 111 * Math.cos(city.lat * Math.PI / 180)
      const walkMinsToCenter = Math.max(2, Math.round(Math.sqrt(latKm ** 2 + lonKm ** 2) * 12))
      const rating = Number(Math.min(9.6, Math.max(6, 5.5 + stars * .75 + (random() * 1.4 - .7))).toFixed(1))
      const reviewCeiling = stars <= 3 ? 4800 : stars === 4 ? 3400 : 1900
      const reviewCount = 40 + Math.floor(random() * (reviewCeiling - 39))
      const guestModifier = 1 + Math.max(0, guests - 2) * .06
      const pricePerNightUsd = Math.max(45, Math.round(stars ** 1.6 * 28 * (city.tier === 1 ? 1.35 : 1) * (weekend(checkIn) ? 1.12 : 1) * guestModifier * (.8 + random() * .4)))
      const amenityTarget = Math.min(10, Math.max(2, stars + Math.floor(random() * 3)))
      const amenities: string[] = []
      if (random() < .96) amenities.push('wifi')
      const shuffled = AMENITIES.filter((a) => a !== 'wifi').map((a) => ({ a, n: random() })).sort((a, b) => a.n - b.n)
      for (const item of shuffled) if (amenities.length < amenityTarget) amenities.push(item.a)
      const suffix = hash(`${name}|${i}|${JSON.stringify({ city: city.name, checkIn, checkOut, guests })}`).toString(16).slice(-2).padStart(2, '0')
      hotels.push({
        id: `${slug(name)}-${suffix}`,
        name,
        city: city.name,
        area: area.name,
        coords: { lat: Number(lat.toFixed(4)), lon: Number(lon.toFixed(4)) },
        stars,
        rating,
        reviewCount,
        pricePerNightUsd,
        amenities,
        walkMinsToCenter,
      })
      }
    }
    hotels.sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id))
    return { hotels }
  },
})
