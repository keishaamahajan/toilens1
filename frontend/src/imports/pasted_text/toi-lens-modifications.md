STOP and modify the EXISTING ToiLens application only. Do not redesign unrelated screens or change the current architecture.

TASK:
1. Remove the “Report Issue” and “Navigate” buttons from the CITIZEN HOME PAGE ONLY.
2. Add a “Campus Data” / “Real Campus Data” option to the map feature.
3. Replace the generic/mock map experience with a VIT Vellore campus-based map using the real building coordinates provided below.
4. Create a partially accurate toilet dataset for the VIT campus:
   - Every mapped building should have toilets associated with it.
   - For the prototype, assume 2 washrooms per floor.
   - Do NOT claim these are the actual verified number of toilets.
   - Make the number of floors configurable per building.
   - If no floor-count data exists, use a prototype default of 3 floors.
   - Therefore, default prototype = 6 washrooms per building.
   - Label this clearly as “Prototype campus data” or “Estimated toilet locations”.
5. Make the map INTERACTIVE and connected to the existing ToiLens toilet data/state.

IMPORTANT:
This is a hackathon MVP, NOT a production municipal system.
Do not build a real backend, authentication system, external government API, or complex GIS infrastructure.
Use realistic structured mock/prototype data based on the actual VIT Vellore campus coordinates.
The app should visually feel like it is tracking real campus sanitation infrastructure.

--------------------------------------------------
A. REMOVE HOME PAGE BUTTONS
--------------------------------------------------

On the citizen HOME PAGE:

REMOVE:
- “Report Issue”
- “Navigate”

Do not remove the existing report functionality from the application.
The reporting functionality should remain accessible from the appropriate report screen/navigation if it already exists.

Do not replace these buttons with other large CTA buttons.

Keep the THI card, nearby toilets, toilet information, filters, and existing home-page functionality intact.

--------------------------------------------------
B. ADD “CAMPUS DATA” MODE
--------------------------------------------------

Add a clear toggle/dropdown near the map:

“DATA SOURCE”

Options:
- Demo Data
- Campus Data

Default to:
Campus Data

When “Campus Data” is selected:
- Show VIT Vellore campus buildings using the coordinates below.
- Show toilet markers associated with those buildings.
- Show building names.
- Show toilet health information from the existing ToiLens THI system.
- Allow clicking a building to see its toilets.
- Allow clicking an individual toilet to open its toilet profile.

Add a small credibility label:

“Campus Data • VIT Vellore • Prototype”

and another small note where appropriate:

“Toilet locations are estimated for MVP demonstration.”

Do NOT call this “live data” unless there is actually a live API.
Use wording such as:
“Campus Data”
“Real Campus Map”
“Campus Geotag Data”
“Prototype Toilet Dataset”

--------------------------------------------------
C. VIT VELLORE BUILDING DATA
--------------------------------------------------

Create a central campusBuildings dataset.

Use these EXACT coordinates:

Anna Audi
12.970050580202205, 79.15563304696111

Dr MGR Block
12.968984347769862, 79.15592516730672

Channa Reddy Block
12.969010753649732, 79.15618070055872

Periyar Library
12.969143110307428, 79.1568890355365

SMV
12.969656084142041, 79.15774572229465

Sri Narayani Health Centre
12.96948426086621, 79.15478707892352

G.D. Naidu Block
12.969729150583913, 79.15481837295958

Technology Towers
12.971009909599799, 79.15949108990554

Ambedkar Auditorium
12.970618681480833, 79.15936027323889

Silver Jubilee Tower
12.971289041305319, 79.16365086010413

SJT Annexe
12.970634601042937, 79.16362848855013

PRP A Block
12.971977943887374, 79.16651999916304

PRP B Block
12.971442913816727, 79.1667334000202

PRP C Block
12.971065363597342, 79.16632938868905

PRP D Block
12.971281395072902, 79.16590258697201

PRP E Block
12.971812387535689, 79.16599374850007

PRP Annexe
12.971281395072241, 79.1671332676574

Gandhi Block
12.972349435798796, 79.1679454340396

Use these as the authoritative coordinates for the MVP.

--------------------------------------------------
D. TOILET DATA MODEL
--------------------------------------------------

Create a structured relationship:

Building
→ Floors
→ Toilets

Example:

{
  id: "MGR-F2-W1",
  buildingId: "mgr-block",
  buildingName: "Dr MGR Block",
  floor: 2,
  toiletNumber: 1,
  latitude: ...,
  longitude: ...,
  gender: "female/male/unisex",
  thiScore: 78,
  predictedThi: 69,
  complaints: 2,
  footfall: 84,
  lastCleaned: "...",
  priority: "OK",
  accessibility: {...}
}

For the prototype:

EVERY FLOOR:
- Toilet 1
- Toilet 2

Default:
3 floors per building unless a building-specific floor count is already available in the code.

Make floor count configurable:

floors: 3

Do NOT permanently hardcode the number 3 throughout the UI.

The architecture should allow changing:

floors: 4

and automatically generating:

Floor 1 → 2 toilets
Floor 2 → 2 toilets
Floor 3 → 2 toilets
Floor 4 → 2 toilets

without rewriting the application.

--------------------------------------------------
E. TOILET COORDINATES
--------------------------------------------------

Do NOT invent random GPS locations far away from buildings.

For MVP purposes, derive toilet coordinates from the parent building coordinate using tiny offsets so multiple toilet markers can be displayed around the building.

For example:

Building coordinate:
lat, lng

Toilet 1:
lat + very small offset
lng + very small offset

Toilet 2:
lat - very small offset
lng - very small offset

Keep offsets extremely small so toilets visually remain associated with their actual building.

Alternatively, if the current map supports indoor/floor-level representation, show the toilets as markers at the building location with floor/toilet metadata in the popup.

The important requirement is:
BUILDING → FLOOR → TOILET relationship.

--------------------------------------------------
F. INTERACTIVE MAP
--------------------------------------------------

Use the existing map technology if the project already has one.

If the project does not have a map library, use a lightweight solution such as Leaflet + OpenStreetMap.

Do NOT rewrite the whole application around a different framework.

The map should:

1. Center on VIT Vellore campus.
2. Display all 18 supplied buildings.
3. Show building markers.
4. Display building names on click/hover.
5. Allow selecting a building.
6. When a building is selected, show:

Building name
Number of floors
Number of prototype toilets
Average THI
Worst toilet THI
Open complaints
Highest-priority toilet

Example:

Dr MGR Block

3 floors
6 prototype toilets

Average THI: 76
Open complaints: 4
Highest risk: Floor 2 • Toilet 1

[View toilets]

--------------------------------------------------
G. TOILET MARKERS
--------------------------------------------------

Give toilet markers health states based on existing THI:

GREEN:
THI >= 75

YELLOW:
THI 50–74

RED:
THI < 50

Do not rely only on marker color.

Include a small map legend:

🟢 Good
🟡 Needs attention
🔴 Cleaning required

Clicking a toilet marker should open a compact card:

“Dr MGR Block”
“Floor 2 • Toilet 1”

THI 68

Predicted in 3h: 54

Last cleaned: 2.5h ago

Complaints: 2

[View toilet]

--------------------------------------------------
H. FLOOR FILTER
--------------------------------------------------

Add a floor filter when a building is selected:

All Floors
Floor 1
Floor 2
Floor 3

If a building has 4 floors, dynamically show Floor 4.

Selecting a floor should only show toilets from that floor.

--------------------------------------------------
I. MAP SEARCH
--------------------------------------------------

Add a simple search box:

“Search campus building or toilet…”

Searching:
“PRP A”

should focus the map on PRP A Block.

Searching:
“Floor 2 Toilet 1”

should find the corresponding toilet.

Keep search simple and deterministic. No AI search API required.

--------------------------------------------------
J. “FIND CLEANEST” EXPERIENCE
--------------------------------------------------

Since this application is supposed to help users find the cleanest restroom, add a map/filter option:

“Cleanest nearby”

Sort toilet markers/cards by:

1. Highest THI
2. Lowest complaint count
3. Most recently cleaned

Show a small result card:

BEST AVAILABLE

PRP A Block
Floor 2 • Toilet 1

THI 94
Recently cleaned

[View]

Do NOT put “Navigate” or “Report Issue” back on the home page.

--------------------------------------------------
K. MAP DATA + EXISTING TOILENS STATE
--------------------------------------------------

VERY IMPORTANT:

Do not create a second disconnected toilet dataset.

Connect the campus toilet data to the EXISTING ToiLens state.

If:
- a citizen submits a complaint
- complaint count increases
- THI changes
- toilet is marked cleaned
- cleaning crew is assigned
- predicted THI changes

the map must reflect those changes.

Example:

Before:
MGR Block Floor 2 Toilet 1
THI = 72

Citizen submits complaint.

After:
Complaints = 3
THI = 66

The map marker should automatically change if it crosses a health threshold.

Similarly:

Authority marks toilet cleaned.

Update:
lastCleaned
complaint/risk state
THI
priority

The map should immediately reflect the new state.

--------------------------------------------------
L. CAMPUS MAP VISUAL DESIGN
--------------------------------------------------

Use the provided VIT campus map image as a VISUAL REFERENCE for the campus layout and building naming.

Do NOT simply display the screenshot as the interactive map background.

The actual map should remain interactive and use the supplied GPS coordinates.

Visually:

- clean civic-tech interface
- VIT/campus feeling
- dark navy map controls
- white cards
- subtle green/yellow/red sanitation indicators
- readable building labels
- minimal clutter
- mobile responsive
- map should occupy most of the available screen

Do not make the map look like Google Maps with unnecessary controls.

--------------------------------------------------
M. DATA CREDIBILITY
--------------------------------------------------

Because this is a hackathon MVP, make the distinction between REAL and PROTOTYPE data obvious but subtle.

Show:

DATA SOURCE
Campus Data

VIT Vellore
18 mapped buildings

Prototype toilet coverage:
2 toilets / floor

Small disclaimer:

“Building coordinates are campus geotags. Toilet-level locations and sanitation metrics are simulated for MVP demonstration.”

This is important because we should NOT falsely claim that we have official real-time toilet inspection data.

--------------------------------------------------
N. AUTHORITY MAP
--------------------------------------------------

The same campus coordinates should also be available on the AUTHORITY MAP.

The authority view should show:

- building
- toilet count
- average THI
- red/yellow/green risk
- complaints
- predicted deterioration
- cleaning priority

Clicking a building opens its toilets.

Clicking a toilet opens the existing toilet profile.

The citizen map and authority map must use the SAME underlying campus data.

--------------------------------------------------
O. DO NOT BREAK EXISTING FEATURES
--------------------------------------------------

Preserve:

- existing THI system
- priority queue
- complaints
- SLA tracking
- toilet profiles
- accessibility
- event mode
- authority dashboard
- existing navigation
- existing styling system
- shared state

Do not redesign unrelated pages.

Do not remove the report functionality itself.
Only remove its HOME PAGE CTA.

Do not add authentication.
Do not add a database.
Do not add real-time backend infrastructure.
Do not add external AI APIs.
Do not create unnecessary dependencies if an existing map library is already present.

--------------------------------------------------
P. FINAL TEST
--------------------------------------------------

After implementation, verify these flows:

1. Open citizen home.
   → “Report Issue” and “Navigate” are gone.

2. Open map.
   → Campus Data is selected.

3. Map loads VIT Vellore.

4. All 18 supplied buildings appear in approximately their correct geographic locations.

5. Click Dr MGR Block.
   → Floors and prototype toilets appear.

6. Select Floor 2.
   → Only Floor 2 toilets appear.

7. Click a toilet.
   → Existing ToiLens toilet profile opens.

8. Submit a complaint.
   → Complaint count changes.
   → THI/risk updates.
   → Map marker updates.

9. Mark toilet cleaned from authority side.
   → Last-cleaned timestamp changes.
   → THI/priority updates.
   → Map updates.

10. Switch between Demo Data and Campus Data.
    → Both modes work without breaking the app.

11. Test on approximately 390px mobile width and desktop width.

12. Fix all console/runtime errors before finishing.

At the end, report ONLY:
- files changed
- map library being used
- where the campus building dataset lives
- where the prototype floor/toilet generation logic lives
- how to change the default number of floors
- how to run the app

Do not redesign anything outside this task.