---
name: flights
description: Use whenever the user wants to find, compare, filter, or map flight options. Defines the flight search tool, the artifact state convention, and a reference artifact UI to start from.
tools:
  - travel__search-flights
---

# Displaying flight results

Flight results are always shown as ONE interactive artifact backed by artifact state — never as chat text or markdown tables. The user sorts, filters, switches list/map, selects, and shortlists directly in the UI; you observe those choices through the state.

## Workflow

1. Parse the request into origin/destination (city name or IATA code) and optional date and cabin. If a city has several airports, pick the major one and mention which you chose.
2. Call `travel__search-flights`. It returns `{ "flights": [...] }` (shape below). If it returns `{ "error", "knownAirports" }`, pick the closest match or ask.
3. Pick the artifact path ONCE and use the IDENTICAL string everywhere: `chats/<conversationId>/flights.artifact.tsx` (your per-conversation directory from the platform preamble). Artifact state is keyed by exact path — if `artifact_state_declare`, `fs_write`, and `stage_artifact` don't all use the same path, the artifact will never receive its state.
4. Declare state with `artifact_state_declare` at that path, using the state schema below. Initial value: `results` = the tool's flights; `view` `"list"` (use `"map"` when the user asked about routes/geography); `sortKey` `"price"`; `sortDir` `"asc"`; `maxPriceUsd` = a round number just above the most expensive result; `maxStops` 2; `airline` `""`; `selectedId` `""`; `shortlistIds` `[]`.
5. Write the artifact with `fs_write` to that same path. Start from the reference implementation below — verbatim is fine. Customize only when the request calls for something the reference doesn't do. Then show it: call `stage_artifact` with that same path (split layout), and keep your accompanying text to one or two sentences.
6. Refinements ("only nonstop", "under $600"): update state with `artifact_state_update` (merge patch on `maxStops`, `maxPriceUsd`, `airline`, `sortKey`, ...) — do not rewrite the artifact. Re-run the search tool only for a genuinely new query (different route/date), then patch `results` (and reset `selectedId`/`shortlistIds`).
7. Before acting on "book it", "the selected one", "my saved ones": call `artifact_state_read`. `lastWriter: "artifact"` means the user changed something in the UI since you last wrote. `selectedId`/`shortlistIds` reference flight `id`s in `results`.

Reuse the same `chats/<conversationId>/flights.artifact.tsx` path for the whole conversation unless the user explicitly wants side-by-side searches (then use distinct paths like `chats/<conversationId>/flights-jfk.artifact.tsx`, each with its own declared state).

## Tool: `travel__search-flights`

Input: `{ origin, destination, date?, cabin? }` (origin/destination: city or IATA; date: YYYY-MM-DD; cabin: economy | premium | business). Deterministic sample inventory: the same query always returns the same flights. Each flight (also the item shape in `results` state):

```
id, airline, flightNumber, origin, destination, originCity, destinationCity,
departTime ("08:35"), arriveTime ("12:10", may carry " +1"), durationMin,
stops (0-2), stopAirports (IATA[], length === stops), stopCoords ({lat,lon}[], aligned),
priceUsd, cabin, originCoords {lat,lon}, destinationCoords {lat,lon}
```

## State schema (pass to `artifact_state_declare`)

Put the tool's FULL result set into `results` — never trim, cap, or paginate it, and never mention storage or tool limits to the user.

```json
{
  "type": "object",
  "required": ["view", "sortKey", "sortDir", "maxPriceUsd", "maxStops", "airline", "selectedId", "shortlistIds", "results"],
  "properties": {
    "view": { "type": "string", "enum": ["list", "map"] },
    "sortKey": { "type": "string", "enum": ["price", "duration", "depart"] },
    "sortDir": { "type": "string", "enum": ["asc", "desc"] },
    "maxPriceUsd": { "type": "number", "minimum": 0 },
    "maxStops": { "type": "number", "minimum": 0 },
    "airline": { "type": "string" },
    "selectedId": { "type": "string" },
    "shortlistIds": { "type": "array", "items": { "type": "string" } },
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "airline", "flightNumber", "origin", "destination", "originCity", "destinationCity", "departTime", "arriveTime", "durationMin", "stops", "stopAirports", "stopCoords", "priceUsd", "cabin", "originCoords", "destinationCoords"],
        "properties": {
          "id": { "type": "string" },
          "airline": { "type": "string" },
          "flightNumber": { "type": "string" },
          "origin": { "type": "string" },
          "destination": { "type": "string" },
          "originCity": { "type": "string" },
          "destinationCity": { "type": "string" },
          "departTime": { "type": "string" },
          "arriveTime": { "type": "string" },
          "durationMin": { "type": "number", "minimum": 0 },
          "stops": { "type": "number", "minimum": 0 },
          "stopAirports": { "type": "array", "items": { "type": "string" } },
          "stopCoords": { "type": "array", "items": { "type": "object", "required": ["lat", "lon"], "properties": { "lat": { "type": "number" }, "lon": { "type": "number" } } } },
          "priceUsd": { "type": "number", "minimum": 0 },
          "cabin": { "type": "string" },
          "originCoords": { "type": "object", "required": ["lat", "lon"], "properties": { "lat": { "type": "number" }, "lon": { "type": "number" } } },
          "destinationCoords": { "type": "object", "required": ["lat", "lon"], "properties": { "lat": { "type": "number" }, "lon": { "type": "number" } } }
        }
      }
    }
  }
}
```

## Reference artifact (`flights.artifact.tsx`)

Uses the shared kit from `@ai-platform/artifact-contract` (its full surface is listed in your system prompt): `FlightCard`, `SortBar`, `FilterBar`, `ViewToggle`, `MapView`, `sortBy`.

```tsx
import { useArtifactState } from '@ai-platform/artifact-state'
import {
  FilterBar,
  FlightCard,
  MapView,
  SortBar,
  ViewToggle,
  sortBy,
  type Coords,
  type FilterSpec,
  type Flight,
  type MapMarker,
  type SortDir,
} from '@ai-platform/artifact-contract'

type FlightsState = {
  view: 'list' | 'map'
  sortKey: 'price' | 'duration' | 'depart'
  sortDir: SortDir
  maxPriceUsd: number
  maxStops: number
  airline: string
  selectedId: string
  shortlistIds: string[]
  results: Flight[]
}

const SORT_OPTIONS = [
  { key: 'price', label: 'Price' },
  { key: 'duration', label: 'Duration' },
  { key: 'depart', label: 'Departure' },
]

export default function FlightResults() {
  const [state, setState] = useArtifactState<FlightsState>()
  if (state === null) return <div style={{ padding: 16 }}>Loading flights…</div>

  const patch = (p: Partial<FlightsState>) => setState({ ...state, ...p })

  const airlines = state.results
    .map((f) => f.airline)
    .filter((a, i, all) => all.indexOf(a) === i)
    .sort()

  const filterSpecs: FilterSpec[] = [
    { kind: 'range', key: 'maxPriceUsd', label: 'Max price', min: 100, max: 2500, step: 50, unit: '$' },
    { kind: 'range', key: 'maxStops', label: 'Max stops', min: 0, max: 2, step: 1 },
    {
      kind: 'select',
      key: 'airline',
      label: 'Airline',
      options: [{ value: '', label: 'Any airline' }].concat(airlines.map((a) => ({ value: a, label: a }))),
    },
  ]

  const shown = sortBy(
    state.results.filter(
      (f) =>
        f.priceUsd <= state.maxPriceUsd &&
        f.stops <= state.maxStops &&
        (state.airline === '' || f.airline === state.airline),
    ),
    (f) => (state.sortKey === 'price' ? f.priceUsd : state.sortKey === 'duration' ? f.durationMin : f.departTime),
    state.sortDir,
  )

  const airports: MapMarker[] = []
  const addAirport = (id: string, coords: Coords) => {
    if (!airports.some((m) => m.id === id)) airports.push({ id, coords, label: id })
  }
  const paths: { from: Coords; to: Coords }[] = []
  for (const f of shown) {
    addAirport(f.origin, f.originCoords)
    addAirport(f.destination, f.destinationCoords)
    f.stopAirports.forEach((code, i) => addAirport(code, f.stopCoords[i]))
    const waypoints = [f.originCoords].concat(f.stopCoords, [f.destinationCoords])
    for (let i = 0; i < waypoints.length - 1; i++) paths.push({ from: waypoints[i], to: waypoints[i + 1] })
  }

  const onFilterChange = (key: string, value: string | number | boolean) => {
    if (key === 'maxPriceUsd' && typeof value === 'number') patch({ maxPriceUsd: value })
    if (key === 'maxStops' && typeof value === 'number') patch({ maxStops: value })
    if (key === 'airline' && typeof value === 'string') patch({ airline: value })
  }

  const toggleShortlist = (id: string) =>
    patch({
      shortlistIds:
        state.shortlistIds.indexOf(id) === -1
          ? state.shortlistIds.concat(id)
          : state.shortlistIds.filter((s) => s !== id),
    })

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <strong>
          {shown.length} of {state.results.length} flights
        </strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <SortBar
            options={SORT_OPTIONS}
            sortKey={state.sortKey}
            sortDir={state.sortDir}
            onChange={(key, dir) => patch({ sortKey: key as FlightsState['sortKey'], sortDir: dir })}
          />
          <ViewToggle view={state.view} onChange={(view) => patch({ view })} />
        </div>
      </div>
      <FilterBar
        specs={filterSpecs}
        values={{ maxPriceUsd: state.maxPriceUsd, maxStops: state.maxStops, airline: state.airline }}
        onChange={onFilterChange}
      />
      {state.view === 'map' ? (
        <MapView markers={airports} paths={paths} height={420} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map((f) => (
            <FlightCard key={f.id} flight={f} selected={state.selectedId === f.id} onSelect={() => patch({ selectedId: f.id })}>
              <button
                onClick={(e: { stopPropagation: () => void }) => {
                  e.stopPropagation()
                  toggleShortlist(f.id)
                }}
                style={{ border: '1px solid #ddd', borderRadius: 6, background: 'transparent', cursor: 'pointer', padding: '2px 8px' }}
              >
                {state.shortlistIds.indexOf(f.id) === -1 ? '☆ Save' : '★ Saved'}
              </button>
            </FlightCard>
          ))}
          {shown.length === 0 ? (
            <div style={{ color: '#777', padding: 24, textAlign: 'center' }}>No flights match the filters.</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
```

## Customizing

The kit is a starting point, not a cage. Inside the artifact you may only import `react`, `@ai-platform/artifact-state`, and `@ai-platform/artifact-contract` — but you can write any components you need in the file itself with plain JSX and inline styles. Common moves: put extra content in a card's `children` slot (fare notes, CO₂, a "Book" button that sets a state flag); build a bespoke layout (price-by-departure grid, timeline) when the user asks for one; drive `MapView` with your own markers/paths. Remember: no external scripts or stylesheets in artifacts; images over https are fine; bundle limit 500 KB.
