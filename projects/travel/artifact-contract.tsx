import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

export type SortDir = 'asc' | 'desc'
export type Coords = { lat: number; lon: number }

export type Flight = {
  id: string
  airline: string
  flightNumber: string
  origin: string
  destination: string
  originCity: string
  destinationCity: string
  departTime: string
  arriveTime: string
  durationMin: number
  stops: number
  stopAirports: string[]
  stopCoords: Coords[]
  priceUsd: number
  cabin: string
  originCoords: Coords
  destinationCoords: Coords
}

export type Hotel = {
  id: string
  name: string
  city: string
  area: string
  coords: Coords
  stars: number
  rating: number
  reviewCount: number
  pricePerNightUsd: number
  amenities: string[]
  walkMinsToCenter: number
}

export function formatPrice(usd: number): string {
  const rounded = Math.round(usd)
  const sign = rounded < 0 ? '-' : ''
  const digits = String(Math.abs(rounded))
  return sign + '$' + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return hours === 0 ? mins + 'm' : hours + 'h' + (mins ? ' ' + mins + 'm' : '')
}

export function formatStops(stops: number): string {
  return stops === 0 ? 'Nonstop' : stops === 1 ? '1 stop' : stops + ' stops'
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function sortBy<T>(items: readonly T[], value: (item: T) => number | string, dir: SortDir): T[] {
  return items
    .map((item, index) => ({ item, index, value: value(item) }))
    .sort((a, b) => {
      const comparison =
        typeof a.value === 'string' && typeof b.value === 'string'
          ? a.value.localeCompare(b.value)
          : a.value < b.value
            ? -1
            : a.value > b.value
              ? 1
              : 0
      return comparison === 0 ? a.index - b.index : dir === 'asc' ? comparison : -comparison
    })
    .map((entry) => entry.item)
}

const colors = {
  text: '#1C1917',
  muted: '#57534E',
  surface: '#FFFFFF',
  page: '#FAF8F5',
  border: '#E7E2DC',
  accent: '#C2410C',
}

const font: CSSProperties = {
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 13.5,
  color: colors.text,
}

const control: CSSProperties = {
  ...font,
  border: '1px solid ' + colors.border,
  borderRadius: 8,
  background: colors.surface,
  padding: '6px 9px',
}

export function SortBar(props: {
  options: ReadonlyArray<{ key: string; label: string }>
  sortKey: string
  sortDir: SortDir
  onChange: (key: string, dir: SortDir) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', ...font }}>
      {props.options.map((option) => {
        const active = option.key === props.sortKey
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => props.onChange(option.key, active ? (props.sortDir === 'asc' ? 'desc' : 'asc') : 'asc')}
            style={{
              ...control,
              cursor: 'pointer',
              color: active ? colors.surface : colors.muted,
              borderColor: active ? colors.accent : colors.border,
              background: active ? colors.accent : colors.surface,
            }}
          >
            {option.label}{active ? (props.sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
          </button>
        )
      })}
    </div>
  )
}

export type FilterSpec =
  | { kind: 'select'; key: string; label: string; options: ReadonlyArray<{ value: string; label: string }> }
  | { kind: 'range'; key: string; label: string; min: number; max: number; step?: number; unit?: string }
  | { kind: 'toggle'; key: string; label: string }

export type FilterValues = Record<string, string | number | boolean>

export function FilterBar(props: {
  specs: readonly FilterSpec[]
  values: FilterValues
  onChange: (key: string, value: string | number | boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', ...font }}>
      {props.specs.map((spec) => {
        const value = props.values[spec.key]
        if (spec.kind === 'select') {
          return (
            <label key={spec.key} style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.muted }}>
              <span>{spec.label}</span>
              <select
                value={typeof value === 'string' ? value : ''}
                onChange={(event: { currentTarget: { value: string } }) => props.onChange(spec.key, event.currentTarget.value)}
                style={{ ...control, cursor: 'pointer' }}
              >
                {spec.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          )
        }
        if (spec.kind === 'range') {
          const numeric = typeof value === 'number' ? value : spec.min
          return (
            <label key={spec.key} style={{ ...control, display: 'flex', alignItems: 'center', gap: 8, color: colors.muted }}>
              <span>{spec.label} <strong style={{ color: colors.text }}>{spec.unit || ''}{numeric}</strong></span>
              <input
                type="range"
                min={spec.min}
                max={spec.max}
                step={spec.step === undefined ? 1 : spec.step}
                value={numeric}
                onChange={(event: { currentTarget: { value: string } }) => props.onChange(spec.key, Number(event.currentTarget.value))}
                style={{ width: 100, accentColor: colors.accent }}
              />
            </label>
          )
        }
        const checked = typeof value === 'boolean' ? value : false
        return (
          <label
            key={spec.key}
            style={{
              ...control,
              cursor: 'pointer',
              color: checked ? colors.surface : colors.muted,
              borderColor: checked ? colors.accent : colors.border,
              background: checked ? colors.accent : colors.surface,
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(event: { currentTarget: { checked: boolean } }) => props.onChange(spec.key, event.currentTarget.checked)}
              style={{ margin: '0 6px 0 0', accentColor: colors.accent }}
            />
            {spec.label}
          </label>
        )
      })}
    </div>
  )
}

export function ViewToggle(props: { view: 'list' | 'map'; onChange: (view: 'list' | 'map') => void }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid ' + colors.border, borderRadius: 8, overflow: 'hidden', ...font }}>
      {(['list', 'map'] as const).map((view) => (
        <button
          key={view}
          type="button"
          onClick={() => props.onChange(view)}
          style={{
            border: 0,
            borderLeft: view === 'map' ? '1px solid ' + colors.border : 0,
            padding: '6px 10px',
            cursor: 'pointer',
            color: props.view === view ? colors.surface : colors.muted,
            background: props.view === view ? colors.accent : colors.surface,
            textTransform: 'capitalize',
          }}
        >{view}</button>
      ))}
    </div>
  )
}

function CardShell(props: { selected?: boolean; onSelect?: () => void; children: ReactNode }) {
  return (
    <div
      onClick={props.onSelect}
      style={{
        ...font,
        border: '1px solid ' + (props.selected ? colors.accent : colors.border),
        borderRadius: 10,
        background: props.selected ? '#FFF5F0' : colors.surface,
        padding: '12px 14px',
        cursor: props.onSelect ? 'pointer' : 'default',
      }}
    >{props.children}</div>
  )
}

export function FlightCard(props: { flight: Flight; selected?: boolean; onSelect?: () => void; children?: ReactNode }) {
  const flight = props.flight
  const stops = formatStops(flight.stops) + (flight.stops > 0 ? ' (' + flight.stopAirports.join(', ') + ')' : '')
  return (
    <CardShell selected={props.selected} onSelect={props.onSelect}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1.1fr) minmax(170px, 1.5fr) auto', gap: 16, alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{flight.departTime} → {flight.arriveTime}</div>
          <div style={{ color: colors.muted, marginTop: 3 }}>{flight.origin}–{flight.destination}</div>
        </div>
        <div>
          <div style={{ color: colors.muted }}>{flight.airline} · {flight.flightNumber}</div>
          <div style={{ marginTop: 4 }}>{formatDuration(flight.durationMin)} · {stops}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{formatPrice(flight.priceUsd)}</div>
          <div style={{ color: colors.muted, marginTop: 3, textTransform: 'capitalize' }}>{flight.cabin}</div>
        </div>
      </div>
      {props.children !== undefined ? <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>{props.children}</div> : null}
    </CardShell>
  )
}

function Chip(props: { children: ReactNode; strong?: boolean }) {
  return <span style={{ border: '1px solid ' + colors.border, borderRadius: 8, padding: '3px 7px', background: colors.page, color: props.strong ? colors.text : colors.muted }}>{props.children}</span>
}

export function HotelCard(props: { hotel: Hotel; selected?: boolean; onSelect?: () => void; children?: ReactNode }) {
  const hotel = props.hotel
  const shownAmenities = hotel.amenities.slice(0, 4)
  return (
    <CardShell selected={props.selected} onSelect={props.onSelect}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 18, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{hotel.name} <span style={{ color: colors.muted, fontSize: 12 }}>{'★'.repeat(hotel.stars)}</span></div>
          <div style={{ color: colors.muted, marginTop: 4 }}>{hotel.area} · {hotel.walkMinsToCenter} min walk to center</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 9, alignItems: 'center' }}>
            <Chip strong><strong>{formatRating(hotel.rating)}</strong> <span style={{ color: colors.muted }}>{hotel.reviewCount} reviews</span></Chip>
            {shownAmenities.map((amenity) => <Chip key={amenity}>{amenity}</Chip>)}
            {hotel.amenities.length > 4 ? <Chip>+{hotel.amenities.length - 4} more</Chip> : null}
          </div>
        </div>
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{formatPrice(hotel.pricePerNightUsd)}</div>
          <div style={{ color: colors.muted, marginTop: 3 }}>/ night</div>
        </div>
      </div>
      {props.children !== undefined ? <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>{props.children}</div> : null}
    </CardShell>
  )
}

export type MapMarker = { id: string; coords: Coords; label: string; sublabel?: string; priceLabel?: string }

type ViewState = { center: Coords; zoom: number }
type Point = { x: number; y: number }

const TILE = 256
const MIN_ZOOM = 2
const MAX_ZOOM = 18

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function project(coords: Coords, zoom: number): Point {
  const scale = TILE * Math.pow(2, zoom)
  const lat = clamp(coords.lat, -85.05112878, 85.05112878) * Math.PI / 180
  return {
    x: (coords.lon + 180) / 360 * scale,
    y: (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2 * scale,
  }
}

function unproject(point: Point, zoom: number): Coords {
  const scale = TILE * Math.pow(2, zoom)
  const lon = point.x / scale * 360 - 180
  const n = Math.PI - 2 * Math.PI * point.y / scale
  return { lat: 180 / Math.PI * Math.atan((Math.exp(n) - Math.exp(-n)) / 2), lon }
}

function allCoords(markers: readonly MapMarker[], paths?: ReadonlyArray<{ from: Coords; to: Coords }>) {
  const result = markers.map((marker) => marker.coords)
  if (paths) paths.forEach((path) => { result.push(path.from, path.to) })
  return result
}

function fitView(markers: readonly MapMarker[], paths: ReadonlyArray<{ from: Coords; to: Coords }> | undefined, width: number, height: number): ViewState {
  const coords = allCoords(markers, paths)
  if (coords.length === 0) return { center: { lat: 20, lon: 0 }, zoom: 2 }
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  coords.forEach((coord) => {
    const point = project(coord, 0)
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  })
  const usableWidth = Math.max(1, width * 0.7)
  const usableHeight = Math.max(1, height * 0.7)
  const spanX = Math.max(1e-9, maxX - minX)
  const spanY = Math.max(1e-9, maxY - minY)
  const zoom = clamp(Math.floor(Math.log(Math.min(usableWidth / spanX, usableHeight / spanY)) / Math.LN2), MIN_ZOOM, 16)
  return { center: unproject({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, 0), zoom }
}

export function MapView(props: {
  markers: readonly MapMarker[]
  paths?: ReadonlyArray<{ from: Coords; to: Coords }>
  selectedId?: string
  onSelect?: (id: string) => void
  height?: number
}) {
  const height = props.height === undefined ? 420 : props.height
  const [width, setWidth] = useState(800)
  const [view, setView] = useState(() => fitView(props.markers, props.paths, 800, height))
  const elementRef = useRef<any>(null)
  const dragRef = useRef<{ x: number; y: number; center: Coords; moved: boolean } | null>(null)
  const suppressClickRef = useRef(false)

  const measure = useCallback(() => {
    const node = elementRef.current
    if (node && node.offsetWidth) setWidth(node.offsetWidth)
  }, [])
  const containerRef = useCallback((node: any) => {
    elementRef.current = node
    if (node && node.offsetWidth) setWidth(node.offsetWidth)
  }, [])

  useEffect(() => {
    const runtimeWindow: any = (globalThis as any).window
    if (!runtimeWindow) return
    runtimeWindow.addEventListener('resize', measure)
    return () => runtimeWindow.removeEventListener('resize', measure)
  }, [measure])

  const centerWorld = project(view.center, view.zoom)
  const screenPoint = (coords: Coords) => {
    const point = project(coords, view.zoom)
    return { x: point.x - centerWorld.x + width / 2, y: point.y - centerWorld.y + height / 2 }
  }

  const tiles = useMemo(() => {
    const result: Array<{ x: number; y: number; wrappedX: number; left: number; top: number }> = []
    const count = Math.pow(2, view.zoom)
    const center = project(view.center, view.zoom)
    const startX = Math.floor((center.x - width / 2) / TILE) - 1
    const endX = Math.floor((center.x + width / 2) / TILE) + 1
    const startY = Math.floor((center.y - height / 2) / TILE) - 1
    const endY = Math.floor((center.y + height / 2) / TILE) + 1
    for (let y = startY; y <= endY; y++) {
      if (y < 0 || y >= count) continue
      for (let x = startX; x <= endX; x++) {
        const wrappedX = ((x % count) + count) % count
        result.push({ x, y, wrappedX, left: x * TILE - center.x + width / 2, top: y * TILE - center.y + height / 2 })
      }
    }
    return result
  }, [view.center.lat, view.center.lon, view.zoom, width, height])

  const changeZoom = (nextZoom: number, anchor?: Point) => {
    const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
    if (zoom === view.zoom) return
    if (!anchor) {
      setView({ center: view.center, zoom })
      return
    }
    const oldCenter = project(view.center, view.zoom)
    const anchorWorld = { x: oldCenter.x + anchor.x - width / 2, y: oldCenter.y + anchor.y - height / 2 }
    const scale = Math.pow(2, zoom - view.zoom)
    const scaledAnchor = { x: anchorWorld.x * scale, y: anchorWorld.y * scale }
    const nextCenter = { x: scaledAnchor.x - anchor.x + width / 2, y: scaledAnchor.y - anchor.y + height / 2 }
    setView({ center: unproject(nextCenter, zoom), zoom })
  }

  const onPointerDown = (event: { clientX: number; clientY: number; pointerId: number; target: { closest?: (selector: string) => unknown }; currentTarget: { setPointerCapture: (id: number) => void } }) => {
    if (event.target.closest && event.target.closest('button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, center: view.center, moved: false }
    suppressClickRef.current = false
  }
  const onPointerMove = (event: { clientX: number; clientY: number }) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true
    const origin = project(drag.center, view.zoom)
    setView({ center: unproject({ x: origin.x - dx, y: origin.y - dy }, view.zoom), zoom: view.zoom })
  }
  const endDrag = () => {
    if (dragRef.current) suppressClickRef.current = dragRef.current.moved
    dragRef.current = null
  }

  const mapButton: CSSProperties = { ...control, padding: '5px 8px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(28,25,23,.12)', fontWeight: 650 }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(event: { clientX: number; clientY: number; currentTarget: { getBoundingClientRect: () => { left: number; top: number } } }) => {
        const rect = event.currentTarget.getBoundingClientRect()
        changeZoom(view.zoom + 1, { x: event.clientX - rect.left, y: event.clientY - rect.top })
      }}
      style={{ ...font, position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius: 10, background: '#E7E5E4', touchAction: 'none', userSelect: 'none' }}
    >
      {tiles.map((tile) => (
        <img
          key={view.zoom + '/' + tile.x + '/' + tile.y}
          src={'https://tile.openstreetmap.org/' + view.zoom + '/' + tile.wrappedX + '/' + tile.y + '.png'}
          draggable={false}
          style={{ position: 'absolute', width: TILE, height: TILE, left: tile.left, top: tile.top, maxWidth: 'none', pointerEvents: 'none' }}
        />
      ))}
      {props.paths && props.paths.length ? (
        <svg width={width} height={height} viewBox={'0 0 ' + width + ' ' + height} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {props.paths.map((path, index) => {
            const from = screenPoint(path.from)
            const to = screenPoint(path.to)
            const dx = to.x - from.x
            const dy = to.y - from.y
            const length = Math.sqrt(dx * dx + dy * dy) || 1
            const curve = Math.min(50, length * 0.12)
            const cx = (from.x + to.x) / 2 - dy / length * curve
            const cy = (from.y + to.y) / 2 + dx / length * curve
            return <path key={index} d={'M ' + from.x + ' ' + from.y + ' Q ' + cx + ' ' + cy + ' ' + to.x + ' ' + to.y} fill="none" stroke={colors.accent} strokeWidth="1.5" strokeOpacity="0.55" />
          })}
        </svg>
      ) : null}
      {props.markers.map((marker) => {
        const point = screenPoint(marker.coords)
        const selected = marker.id === props.selectedId
        return (
          <button
            key={marker.id}
            type="button"
            title={marker.label + (marker.sublabel ? ' — ' + marker.sublabel : '')}
            onClick={(event: { stopPropagation: () => void }) => {
              event.stopPropagation()
              if (suppressClickRef.current) { suppressClickRef.current = false; return }
              if (props.onSelect) props.onSelect(marker.id)
            }}
            style={{
              ...font,
              position: 'absolute',
              left: point.x,
              top: point.y,
              transform: 'translate(-50%, -100%)',
              zIndex: selected ? 4 : 3,
              maxWidth: '18ch',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              border: '1px solid ' + (selected ? colors.accent : '#D6D3D1'),
              borderRadius: 8,
              padding: '5px 8px',
              cursor: props.onSelect ? 'pointer' : 'default',
              color: selected ? colors.surface : colors.text,
              background: selected ? colors.accent : colors.surface,
              boxShadow: '0 1px 4px rgba(28,25,23,.18)',
              fontWeight: 650,
            }}
          >{marker.priceLabel || marker.label}</button>
        )
      })}
      <div style={{ position: 'absolute', top: 9, left: 9, zIndex: 5, display: 'flex', gap: 5 }}>
        <button type="button" aria-label="Zoom in" onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); changeZoom(view.zoom + 1) }} style={mapButton}>+</button>
        <button type="button" aria-label="Zoom out" onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); changeZoom(view.zoom - 1) }} style={mapButton}>−</button>
        <button type="button" onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); setView(fitView(props.markers, props.paths, width, height)) }} style={mapButton}>⊙ Fit</button>
      </div>
      <div style={{ position: 'absolute', right: 4, bottom: 3, zIndex: 5, padding: '2px 4px', borderRadius: 3, background: 'rgba(255,255,255,.82)', color: colors.muted, fontSize: 10 }}>© OpenStreetMap contributors</div>
    </div>
  )
}
