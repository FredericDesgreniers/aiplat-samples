import { defineTool } from '@ai-platform/plugin-sdk'

type Airport = { code: string; city: string; name: string; lat: number; lon: number; hub: boolean }

const AIRPORTS: Airport[] = [
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco International', lat: 37.6213, lon: -122.379, hub: true },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International', lat: 33.9416, lon: -118.4085, hub: true },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy International', lat: 40.6413, lon: -73.7781, hub: true },
  { code: 'EWR', city: 'Newark', name: 'Newark Liberty International', lat: 40.6895, lon: -74.1745, hub: true },
  { code: 'ORD', city: 'Chicago', name: "O'Hare International", lat: 41.9742, lon: -87.9073, hub: true },
  { code: 'ATL', city: 'Atlanta', name: 'Hartsfield-Jackson Atlanta International', lat: 33.6407, lon: -84.4277, hub: true },
  { code: 'DFW', city: 'Dallas', name: 'Dallas Fort Worth International', lat: 32.8998, lon: -97.0403, hub: true },
  { code: 'SEA', city: 'Seattle', name: 'Seattle-Tacoma International', lat: 47.4502, lon: -122.3088, hub: true },
  { code: 'BOS', city: 'Boston', name: 'Logan International', lat: 42.3656, lon: -71.0096, hub: false },
  { code: 'MIA', city: 'Miami', name: 'Miami International', lat: 25.7959, lon: -80.287, hub: true },
  { code: 'DEN', city: 'Denver', name: 'Denver International', lat: 39.8561, lon: -104.6737, hub: true },
  { code: 'YYZ', city: 'Toronto', name: 'Toronto Pearson International', lat: 43.6777, lon: -79.6248, hub: true },
  { code: 'YUL', city: 'Montreal', name: 'Montréal-Trudeau International', lat: 45.4706, lon: -73.7408, hub: false },
  { code: 'YVR', city: 'Vancouver', name: 'Vancouver International', lat: 49.1967, lon: -123.1815, hub: true },
  { code: 'LHR', city: 'London', name: 'Heathrow Airport', lat: 51.47, lon: -0.4543, hub: true },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', lat: 49.0097, lon: 2.5479, hub: true },
  { code: 'AMS', city: 'Amsterdam', name: 'Amsterdam Airport Schiphol', lat: 52.3105, lon: 4.7683, hub: true },
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', lat: 50.0379, lon: 8.5622, hub: true },
  { code: 'MAD', city: 'Madrid', name: 'Adolfo Suárez Madrid-Barajas', lat: 40.4983, lon: -3.5676, hub: true },
  { code: 'LIS', city: 'Lisbon', name: 'Humberto Delgado Airport', lat: 38.7742, lon: -9.1342, hub: false },
  { code: 'FCO', city: 'Rome', name: 'Leonardo da Vinci-Fiumicino', lat: 41.8003, lon: 12.2389, hub: true },
  { code: 'ZRH', city: 'Zurich', name: 'Zurich Airport', lat: 47.4581, lon: 8.5555, hub: true },
  { code: 'DXB', city: 'Dubai', name: 'Dubai International', lat: 25.2532, lon: 55.3657, hub: true },
  { code: 'DOH', city: 'Doha', name: 'Hamad International', lat: 25.2731, lon: 51.6081, hub: true },
  { code: 'NRT', city: 'Tokyo', name: 'Narita International', lat: 35.772, lon: 140.3929, hub: true },
  { code: 'HND', city: 'Tokyo', name: 'Haneda Airport', lat: 35.5494, lon: 139.7798, hub: true },
  { code: 'ICN', city: 'Seoul', name: 'Incheon International', lat: 37.4602, lon: 126.4407, hub: true },
  { code: 'SIN', city: 'Singapore', name: 'Singapore Changi', lat: 1.3644, lon: 103.9915, hub: true },
  { code: 'HKG', city: 'Hong Kong', name: 'Hong Kong International', lat: 22.308, lon: 113.9185, hub: true },
  { code: 'SYD', city: 'Sydney', name: 'Sydney Kingsford Smith', lat: -33.9399, lon: 151.1753, hub: true },
]

const AIRLINES = [
  { name: 'Delta', code: 'DL' }, { name: 'United', code: 'UA' },
  { name: 'American Airlines', code: 'AA' }, { name: 'Air Canada', code: 'AC' },
  { name: 'British Airways', code: 'BA' }, { name: 'Air France', code: 'AF' },
  { name: 'Lufthansa', code: 'LH' }, { name: 'KLM', code: 'KL' },
  { name: 'Emirates', code: 'EK' }, { name: 'ANA', code: 'NH' },
]

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function resolveAirport(value: string) {
  const query = String(value || '').trim().toLowerCase()
  return AIRPORTS.find((a) => a.code.toLowerCase() === query) || AIRPORTS.find((a) => a.city.toLowerCase().includes(query) && query.length > 0)
}

function coords(airport: Airport) {
  return { lat: Number(airport.lat.toFixed(4)), lon: Number(airport.lon.toFixed(4)) }
}

function clock(totalMinutes: number) {
  const day = Math.floor(totalMinutes / 1440)
  const minute = ((totalMinutes % 1440) + 1440) % 1440
  const value = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
  return day > 0 ? `${value} +${day}` : value
}

function weekend(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day === 0 || day === 6
}

export default defineTool({
  name: 'search-flights',
  description: 'Search deterministic sample flight inventory by route, date, and cabin, including schedules, stops, coordinates, durations, and USD prices.',
  inputSchema: {
    type: 'object',
    properties: {
      origin: { type: 'string' },
      destination: { type: 'string' },
      date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      cabin: { type: 'string', enum: ['economy', 'premium', 'business'], default: 'economy' },
    },
    required: ['origin', 'destination'],
    additionalProperties: false,
  },
  async execute(_ctx, input) {
    const origin = resolveAirport(input.origin)
    const destination = resolveAirport(input.destination)
    const knownAirports = AIRPORTS.map((a) => `${a.code} — ${a.city}`)
    if (!origin) return { error: `Unknown origin/destination: ${input.origin}`, knownAirports }
    if (!destination) return { error: `Unknown origin/destination: ${input.destination}`, knownAirports }

    const date = input.date || ''
    const cabin = input.cabin || 'economy'
    const normalized = { origin: origin.code, destination: destination.code, date, cabin }
    const random = mulberry32(hash(JSON.stringify(normalized)))
    const directKm = Math.max(1, distanceKm(origin, destination))
    const candidates = AIRPORTS.filter((a) => a.hub && a.code !== origin.code && a.code !== destination.code)
      .map((a) => ({ airport: a, detour: distanceKm(origin, a) + distanceKm(a, destination) - directKm }))
      .sort((a, b) => a.detour - b.detour)
      .slice(0, 10)
    const flights = []
    const corridor = directKm < 1200 ? 'short' : directKm < 5500 ? 'medium' : 'long'
    const airlineThreshold = corridor === 'short'
      ? (origin.hub && destination.hub ? .55 : .38)
      : corridor === 'medium'
        ? (origin.hub && destination.hub ? .8 : .48)
        : (origin.hub && destination.hub ? .6 : .4)
    const routeAirlines = AIRLINES.filter((airline) => {
      const routeRotation = hash(`${origin.code}|${destination.code}`) % AIRLINES.length
      const serviceScore = ((AIRLINES.indexOf(airline) + routeRotation) % AIRLINES.length) / AIRLINES.length
      return serviceScore < airlineThreshold
    })
    if (!routeAirlines.length) {
      routeAirlines.push(AIRLINES[hash(`${origin.code}|${destination.code}`) % AIRLINES.length])
    }

    for (const airline of routeAirlines) {
      const cadence = corridor === 'short'
        ? 155 + Math.floor(random() * 86)
        : corridor === 'medium'
          ? 205 + Math.floor(random() * 111)
          : 280 + Math.floor(random() * 121)
      const firstDeparture = 360 + Math.floor(random() * cadence)
      for (let depart = firstDeparture; depart <= 1320; depart += cadence) {
      const roll = random()
      const stops = directKm < 2500 ? (roll < 0.7 ? 0 : roll < 0.96 ? 1 : 2) : (roll < 0.3 ? 0 : roll < 0.88 ? 1 : 2)
      const pool = [...candidates]
      const selected: Airport[] = []
      for (let s = 0; s < stops && pool.length; s++) {
        const upper = Math.min(6, pool.length)
        const index = Math.floor(random() * upper)
        selected.push(pool.splice(index, 1)[0].airport)
      }
      selected.sort((a, b) => distanceKm(origin, a) - distanceKm(origin, b))
      let routeKm = 0
      let previous: Airport = origin
      for (const stop of selected) { routeKm += distanceKm(previous, stop); previous = stop }
      routeKm += distanceKm(previous, destination)
      const layover = selected.reduce((sum) => sum + 75 + Math.floor(random() * 46), 0)
      const durationMin = Math.max(45, Math.round((routeKm / 830 * 60 + 40 + layover) * (0.9 + random() * 0.2)))
      const flightNumberValue = 100 + Math.floor(random() * 8900)
      const flightNumber = `${airline.code} ${flightNumberValue}`
      const cabinMultiplier = cabin === 'business' ? 3.2 : cabin === 'premium' ? 1.8 : 1
      const priceUsd = Math.max(75, Math.round((directKm * 0.09 + 60) * cabinMultiplier * (stops === 0 ? 1.15 : 1) * (weekend(date) ? 1.1 : 1) * (0.8 + random() * 0.4)))
      flights.push({
        id: `${airline.code.toLowerCase()}${flightNumberValue}-${clock(depart).slice(0, 5).replace(':', '')}`,
        airline: airline.name,
        flightNumber,
        origin: origin.code,
        destination: destination.code,
        originCity: origin.city,
        destinationCity: destination.city,
        departTime: clock(depart),
        arriveTime: clock(depart + durationMin),
        durationMin,
        stops: selected.length,
        stopAirports: selected.map((a) => a.code),
        stopCoords: selected.map(coords),
        priceUsd,
        cabin,
        originCoords: coords(origin),
        destinationCoords: coords(destination),
      })
      }
    }
    flights.sort((a, b) => a.priceUsd - b.priceUsd || a.id.localeCompare(b.id))
    return { flights }
  },
})
