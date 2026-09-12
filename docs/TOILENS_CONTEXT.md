# ToiLens MVP context

## Architecture

This is a deliberately lightweight React + Vite single-page MVP. `src/main.jsx` holds the component library, static toilet seed data, routing, and an `AppContext` local state provider. No authentication, server, municipal integration, database, or ML model is used.

## Data and state

Eight representative Delhi public toilets are seeded with the required operational fields: identifier, geography, current/predicted THI, cleaning time, complaints, footfall, issue, priority, accessibility, trust score, and SLA status. Submitting a report generates a local ticket ID and updates the selected toilet's complaint count and top issue immediately through shared context.

## Routes

- `/` citizen home: THI summary, map-style nearby view, filterable facilities.
- `/toilet/:id` facility detail, trends, SLA and reporting entry point.
- `/report?toilet=TL-101` two-step report modal (the toilet query is optional).
- `/authority` desktop-first operational command center with KPI metrics and an actionable three-lane priority queue.
- `/authority/map` simulated zone heatmap with selectable zones, time-range controls, and an event-demand mode.
- `/authority/toilet/:id` authority facility profile with health drivers, trends, and operational controls.
- `/authority/complaints` AI-assisted complaint inbox with deterministic classification, reasoning, and SLA timeline.
- `/authority/accessibility` independent facility-access assessment and editable accessibility criteria.

## Authority operations

The authority experience intentionally uses the existing `AppContext` rather than a separate dashboard store. In addition to citizen reports, the provider now exposes `assignCrew`, `markCleaned`, `inspect`, and `flagRepair`. Each action updates the selected facility in local shared state and produces a toast; health, priority, SLA, and queue placement therefore refresh across the authority screens and citizen facility views within the active session. This is MVP-only operational simulation, not dispatch infrastructure.

## Operations layer

Complaint records, accessibility assessments, and event-readiness state also live in `AppContext`. Complaint actions update local classification/status; the reusable SLA timeline uses a browser-second countdown seeded from the facility’s SLA status. Event Mode models the Temple festival in the Central zone: applying its recommendations deterministically raises projected footfall, lowers predicted THI, and updates risk/assignment state. Accessibility is intentionally isolated from THI: ramp, grab rail, door-width, lighting, and menstrual-hygiene checks are each editable and compute a separate equally weighted score.

AI language is explainable rather than generative: all recurring/systemic tags and driver text derive from fixed mock complaint frequency, footfall, issue repetition, predicted health, and service-time rules.

## Integration rules

The MVP now treats each state change as a cross-product workflow. A citizen report creates a new inbox record, increments complaint count, reduces current/predicted THI deterministically, and promotes the facility to the appropriate queue lane. Crew assignment records an owner and refreshes SLA status. Marking a facility clean updates service time and health, clears active complaint count, resolves linked inbox records, and returns the toilet to the low-priority lane. Applying Event Mode recommendations raises Central-zone footfall, lowers predicted THI, and raises priority/SLA risk. Accessibility checks remain an independent score and never alter THI.

All facility surfaces use the same shared toilet ID and object data. Authority profiles are the canonical operational profile; citizen detail screens present the same live facility state in a citizen-focused view.

## Design decisions

The interface uses light civic surfaces, a restrained green trust signal, saffron attention, and red urgency. The desktop sidebar becomes a mobile bottom navigation. Chart and map panels are CSS/SVG visual summaries so the prototype remains fast and dependency-light. Component primitives are intentionally reusable and include THICard, StatusBadge, PriorityCard, ComplaintCard, MetricCard, IssueChip, AccessibilityBadge, SLAProgress, FootfallChart, THIChart, MapPanel, BottomNavigation, Sidebar, Modal, Toast, Button, and Tabs.
