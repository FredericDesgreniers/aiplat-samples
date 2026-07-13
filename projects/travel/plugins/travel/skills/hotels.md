---
name: hotels
description: Use whenever the user wants to find, compare, filter, or map hotels or places to stay. Defines the hotel search tool, the artifact state convention, and a reference artifact UI to start from.
tools:
  - travel__search-hotels
---

# Displaying hotel results

Hotel results are always shown as ONE interactive artifact backed by artifact state — never as chat text or markdown tables. The user sorts, filters, switches list/map, selects, and shortlists in the UI; you observe those choices through the state. The map view matters more for hotels than flights: location is usually the deciding factor.

## Workflow

1. Parse the request into a city plus optional check-in/check-out dates and guest count.
2. Call `travel__search-hotels`. It returns `{ "hotels": [...] }` (shape below). If it returns `{ "error", "knownCities" }`, pick the closest match or ask.
3. Pick the artifact path ONCE and use the IDENTICAL string everywhere: `chats/<conversationId>/hotels.artifact.tsx` (your per-conversation directory from the platform preamble). Artifact state is keyed by exact path — if `artifact_state_declare`, `fs_write`, and `stage_artifact` don't all use the same path, the artifact will never receive its state.
4. Declare state with `artifact_state_declare` at that path, using the state schema below. Initial value: `results` = the tool's hotels; `view` `"list"` — but `"map"` when the user asked about location ("near the old town", "walkable to the center"); `sortKey` `"rating"`; `sortDir` `"desc"`; `maxPricePerNight` = a round number just above the most expensive result; `minRating` 5; `amenity` `""`; `selectedId` `""`; `shortlistIds` `[]`.
5. Write the artifact with `fs_write` to that same path. Start from the reference implementation below — verbatim is fine. Customize only when the request calls for it. Then show it: call `stage_artifact` with that same path (split layout), and keep your accompanying text to one or two sentences.
6. Refinements ("under $200", "needs a pool"): update state with `artifact_state_update` (merge patch on `maxPricePerNight`, `minRating`, `amenity`, `sortKey`, ...) — do not rewrite the artifact. Re-run the search tool only for a new city or dates, then patch `results` (and reset `selectedId`/`shortlistIds`).
7. Before acting on "book it", "the one I picked", "my saved ones": call `artifact_state_read`. `lastWriter: "artifact"` means the user changed something in the UI since you last wrote. `selectedId`/`shortlistIds` reference hotel `id`s in `results`.

Reuse the same `chats/<conversationId>/hotels.artifact.tsx` path for the whole conversation unless the user wants side-by-side city comparisons (then use distinct paths like `chats/<conversationId>/hotels-lisbon.artifact.tsx`, each with its own declared state).

## Tool: `travel__search-hotels`

Input: `{ city, checkIn?, checkOut?, guests? }` (dates YYYY-MM-DD; guests 1–6). Deterministic sample inventory: the same query always returns the same hotels. Each hotel (also the item shape in `results` state):

```
id, name, city, area (neighborhood), coords {lat,lon}, stars (2-5),
rating (0-10, one decimal), reviewCount, pricePerNightUsd,
amenities (string[] from: wifi, breakfast, pool, gym, spa, parking, bar,
restaurant, laundry, airport-shuttle), walkMinsToCenter
```

## State schema (pass to `artifact_state_declare`)

Put the tool's FULL result set into `results` — never trim, cap, or paginate it, and never mention storage or tool limits to the user.

```json
{
  "type": "object",
  "required": ["view", "sortKey", "sortDir", "maxPricePerNight", "minRating", "amenity", "selectedId", "shortlistIds", "results"],
  "properties": {
    "view": { "type": "string", "enum": ["list", "map"] },
    "sortKey": { "type": "string", "enum": ["price", "rating", "distance"] },
    "sortDir": { "type": "string", "enum": ["asc", "desc"] },
    "maxPricePerNight": { "type": "number", "minimum": 0 },
    "minRating": { "type": "number", "minimum": 0, "maximum": 10 },
    "amenity": { "type": "string" },
    "selectedId": { "type": "string" },
    "shortlistIds": { "type": "array", "items": { "type": "string" } },
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "city", "area", "coords", "stars", "rating", "reviewCount", "pricePerNightUsd", "amenities", "walkMinsToCenter"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "city": { "type": "string" },
          "area": { "type": "string" },
          "coords": { "type": "object", "required": ["lat", "lon"], "properties": { "lat": { "type": "number" }, "lon": { "type": "number" } } },
          "stars": { "type": "number", "minimum": 1, "maximum": 5 },
          "rating": { "type": "number", "minimum": 0, "maximum": 10 },
          "reviewCount": { "type": "number", "minimum": 0 },
          "pricePerNightUsd": { "type": "number", "minimum": 0 },
          "amenities": { "type": "array", "items": { "type": "string" } },
          "walkMinsToCenter": { "type": "number", "minimum": 0 }
        }
      }
    }
  }
}
```

## Reference artifact (`hotels.artifact.tsx`)

Uses the shared kit from `@ai-platform/artifact-contract` (its full surface is listed in your system prompt): `HotelCard`, `SortBar`, `FilterBar`, `ViewToggle`, `MapView`, `sortBy`, `formatPrice`.

```tsx
import { useArtifactState } from '@ai-platform/artifact-state'
import {
  FilterBar,
  HotelCard,
  MapView,
  SortBar,
  ViewToggle,
  formatPrice,
  sortBy,
  type FilterSpec,
  type Hotel,
  type MapMarker,
  type SortDir,
} from '@ai-platform/artifact-contract'

type HotelsState = {
  view: 'list' | 'map'
  sortKey: 'price' | 'rating' | 'distance'
  sortDir: SortDir
  maxPricePerNight: number
  minRating: number
  amenity: string
  selectedId: string
  shortlistIds: string[]
  results: Hotel[]
}

const SORT_OPTIONS = [
  { key: 'rating', label: 'Rating' },
  { key: 'price', label: 'Price' },
  { key: 'distance', label: 'Distance' },
]

export default function HotelResults() {
  const [state, setState] = useArtifactState<HotelsState>()
  if (state === null) return <div style={{ padding: 16 }}>Loading hotels…</div>

  const patch = (p: Partial<HotelsState>) => setState({ ...state, ...p })

  const amenities = state.results
    .reduce((all, h) => all.concat(h.amenities), [] as string[])
    .filter((a, i, all) => all.indexOf(a) === i)
    .sort()

  const filterSpecs: FilterSpec[] = [
    { kind: 'range', key: 'maxPricePerNight', label: 'Max price / night', min: 50, max: 1000, step: 25, unit: '$' },
    { kind: 'range', key: 'minRating', label: 'Min rating', min: 5, max: 10, step: 0.5 },
    {
      kind: 'select',
      key: 'amenity',
      label: 'Amenity',
      options: [{ value: '', label: 'Any amenity' }].concat(amenities.map((a) => ({ value: a, label: a }))),
    },
  ]

  const shown = sortBy(
    state.results.filter(
      (h) =>
        h.pricePerNightUsd <= state.maxPricePerNight &&
        h.rating >= state.minRating &&
        (state.amenity === '' || h.amenities.indexOf(state.amenity) !== -1),
    ),
    (h) => (state.sortKey === 'price' ? h.pricePerNightUsd : state.sortKey === 'rating' ? h.rating : h.walkMinsToCenter),
    state.sortDir,
  )

  const markers: MapMarker[] = shown.map((h) => ({
    id: h.id,
    coords: h.coords,
    label: h.name,
    sublabel: h.area,
    priceLabel: formatPrice(h.pricePerNightUsd),
  }))

  const onFilterChange = (key: string, value: string | number | boolean) => {
    if (key === 'maxPricePerNight' && typeof value === 'number') patch({ maxPricePerNight: value })
    if (key === 'minRating' && typeof value === 'number') patch({ minRating: value })
    if (key === 'amenity' && typeof value === 'string') patch({ amenity: value })
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
          {shown.length} of {state.results.length} hotels
        </strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <SortBar
            options={SORT_OPTIONS}
            sortKey={state.sortKey}
            sortDir={state.sortDir}
            onChange={(key, dir) => patch({ sortKey: key as HotelsState['sortKey'], sortDir: dir })}
          />
          <ViewToggle view={state.view} onChange={(view) => patch({ view })} />
        </div>
      </div>
      <FilterBar
        specs={filterSpecs}
        values={{ maxPricePerNight: state.maxPricePerNight, minRating: state.minRating, amenity: state.amenity }}
        onChange={onFilterChange}
      />
      {state.view === 'map' ? (
        <MapView markers={markers} selectedId={state.selectedId} onSelect={(id) => patch({ selectedId: id })} height={440} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map((h) => (
            <HotelCard key={h.id} hotel={h} selected={state.selectedId === h.id} onSelect={() => patch({ selectedId: h.id })}>
              <button
                onClick={(e: { stopPropagation: () => void }) => {
                  e.stopPropagation()
                  toggleShortlist(h.id)
                }}
                style={{ border: '1px solid #ddd', borderRadius: 6, background: 'transparent', cursor: 'pointer', padding: '2px 8px' }}
              >
                {state.shortlistIds.indexOf(h.id) === -1 ? '☆ Save' : '★ Saved'}
              </button>
            </HotelCard>
          ))}
          {shown.length === 0 ? (
            <div style={{ color: '#777', padding: 24, textAlign: 'center' }}>No hotels match the filters.</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
```

## Customizing

The kit is a starting point, not a cage. Inside the artifact you may only import `react`, `@ai-platform/artifact-state`, and `@ai-platform/artifact-contract` — but you can write any components you need in the file itself with plain JSX and inline styles. Common moves: extra content in a card's `children` slot (nightly-total for the stay, a "Book" button that sets a state flag); a bespoke comparison layout when the user shortlists 2–3 hotels; custom markers/paths on `MapView` (e.g. a landmark the user cares about as an extra marker). Remember: no external scripts or stylesheets in artifacts; images over https are fine; bundle limit 500 KB.
