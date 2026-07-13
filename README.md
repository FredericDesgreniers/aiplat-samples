# AI/AP Samples

Public sample apps for the [AI/AP](https://ai.frde.me) agent app platform. Each
directory under `projects/` is a complete, releasable app: agent prompt,
config, theme, tool grants, artifact contract, and plugins (skills + tools).

## Travel (`projects/travel`)

"Wayfarer" — a travel concierge that renders flight and hotel search results as
interactive artifacts: sortable, filterable lists with a map view (dependency-free
OpenStreetMap component), backed by shared artifact state so the agent can read
selections and shortlists the user makes in the UI.

- `agent.md` — persona and non-negotiable workflow (skills first, artifacts always,
  state is the source of truth)
- `plugins/travel/skills/` — per-domain playbooks: workflow, state schema, and a
  complete reference artifact to start from
- `plugins/travel/tools/` — deterministic mock search tools; inventory size comes
  from domain structure (carriers × departures, hotels per neighborhood), never
  from arbitrary caps
- `artifact-contract.tsx` — the shared component kit artifacts build on
